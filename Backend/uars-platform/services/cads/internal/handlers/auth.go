package handlers

import (
	"context"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/portalvii/uars7/services/cads/internal/auth"
	"github.com/portalvii/uars7/services/cads/internal/directory"
	authpb "github.com/portalvii/uars7/shared/proto/auth/v1"
	commonpb "github.com/portalvii/uars7/shared/proto/v1"
)

type AuthHandler struct {
	authpb.UnimplementedAuthServiceServer
	authService      *auth.Service
	directoryService *directory.Service
	logger           *logrus.Logger
}

func NewAuthHandler(authService *auth.Service, directoryService *directory.Service, logger *logrus.Logger) *AuthHandler {
	return &AuthHandler{
		authService:      authService,
		directoryService: directoryService,
		logger:           logger,
	}
}

func (h *AuthHandler) Authenticate(ctx context.Context, req *authpb.AuthRequest) (*authpb.AuthResponse, error) {
	h.logger.WithFields(logrus.Fields{
		"username":  req.Username,
		"client_id": req.ClientId,
	}).Info("Authentication request received")

	if req.Username == "" || req.Password == "" {
		return &authpb.AuthResponse{
			Success: false,
			Errors:  []string{"username and password are required"},
		}, nil
	}

	user, token, err := h.authService.Authenticate(ctx, req.Username, req.Password)
	if err != nil {
		h.logger.WithError(err).Error("Authentication failed")
		return &authpb.AuthResponse{
			Success: false,
			Errors:  []string{err.Error()},
		}, nil
	}

	// Get user profile for additional information
	profile, err := h.directoryService.GetUserProfile(ctx, user.ID)
	if err != nil {
		h.logger.WithError(err).Warn("Failed to get user profile")
	}

	pbUser := &commonpb.User{
		Id:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Roles:    user.Roles,
	}

	if profile != nil {
		pbUser.Attributes = profile.Attributes
		pbUser.CreatedAt = timestamppb.New(profile.CreatedAt)
		pbUser.UpdatedAt = timestamppb.New(profile.UpdatedAt)
	}

	return &authpb.AuthResponse{
		Success:      true,
		AccessToken:  token,
		RefreshToken: token, // In production, generate separate refresh token
		User:         pbUser,
	}, nil
}

func (h *AuthHandler) ValidateToken(ctx context.Context, req *authpb.ValidateTokenRequest) (*authpb.ValidateTokenResponse, error) {
	h.logger.WithField("token_length", len(req.Token)).Info("Token validation request received")

	if req.Token == "" {
		return &authpb.ValidateTokenResponse{
			Valid: false,
			Error: "token is required",
		}, nil
	}

	claims, err := h.authService.ValidateToken(ctx, req.Token)
	if err != nil {
		h.logger.WithError(err).Debug("Token validation failed")
		return &authpb.ValidateTokenResponse{
			Valid: false,
			Error: err.Error(),
		}, nil
	}

	securityContext := &commonpb.SecurityContext{
		UserId:    claims.UserID,
		SessionId: "session-" + claims.UserID, // Generate proper session ID in production
		// Permissions would be derived from roles in production
		ExpiresAt: timestamppb.New(claims.StandardClaims.ExpiresAt),
	}

	return &authpb.ValidateTokenResponse{
		Valid:   true,
		Context: securityContext,
	}, nil
}

func (h *AuthHandler) RefreshToken(ctx context.Context, req *authpb.RefreshTokenRequest) (*authpb.RefreshTokenResponse, error) {
	h.logger.Info("Token refresh request received")

	if req.RefreshToken == "" {
		return &authpb.RefreshTokenResponse{
			Success: false,
			Error:   "refresh token is required",
		}, nil
	}

	newToken, err := h.authService.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		h.logger.WithError(err).Error("Token refresh failed")
		return &authpb.RefreshTokenResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	return &authpb.RefreshTokenResponse{
		Success:     true,
		AccessToken: newToken,
	}, nil
}

func (h *AuthHandler) Logout(ctx context.Context, req *authpb.LogoutRequest) (*authpb.LogoutResponse, error) {
	h.logger.Info("Logout request received")

	// In production, invalidate the token in a blacklist or revocation list
	// For now, just return success

	return &authpb.LogoutResponse{
		Success: true,
		Message: "Successfully logged out",
	}, nil
}

func (h *AuthHandler) GetUserProfile(ctx context.Context, req *authpb.GetUserProfileRequest) (*authpb.GetUserProfileResponse, error) {
	h.logger.WithField("user_id", req.UserId).Info("Get user profile request received")

	if req.UserId == "" {
		return nil, status.Errorf(codes.InvalidArgument, "user_id is required")
	}

	profile, err := h.directoryService.GetUserProfile(ctx, req.UserId)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get user profile")
		return &authpb.GetUserProfileResponse{
			Error: err.Error(),
		}, nil
	}

	pbUser := &commonpb.User{
		Id:         profile.ID,
		Username:   profile.Username,
		Email:      profile.Email,
		Roles:      profile.Roles,
		Attributes: profile.Attributes,
		CreatedAt:  timestamppb.New(profile.CreatedAt),
		UpdatedAt:  timestamppb.New(profile.UpdatedAt),
	}

	return &authpb.GetUserProfileResponse{
		User: pbUser,
	}, nil
}
