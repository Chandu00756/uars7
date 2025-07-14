package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	logger    *logrus.Logger
	jwtSecret []byte
	tokenTTL  time.Duration
}

type User struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Email    string   `json:"email"`
	Password string   `json:"-"`
	Roles    []string `json:"roles"`
	Active   bool     `json:"active"`
}

type Claims struct {
	UserID   string   `json:"user_id"`
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
	jwt.StandardClaims
}

func NewService(logger *logrus.Logger) *Service {
	return &Service{
		logger:    logger,
		jwtSecret: []byte("your-secret-key"), // Should be from config
		tokenTTL:  24 * time.Hour,
	}
}

func (s *Service) Authenticate(ctx context.Context, username, password string) (*User, string, error) {
	s.logger.WithFields(logrus.Fields{
		"username": username,
		"action":   "authenticate",
	}).Info("Authentication attempt")

	// In a real implementation, this would query the database
	user, err := s.getUserByUsername(username)
	if err != nil {
		return nil, "", err
	}

	if !s.verifyPassword(password, user.Password) {
		return nil, "", errors.New("invalid credentials")
	}

	if !user.Active {
		return nil, "", errors.New("user account is disabled")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *Service) ValidateToken(ctx context.Context, tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (s *Service) RefreshToken(ctx context.Context, tokenString string) (string, error) {
	claims, err := s.ValidateToken(ctx, tokenString)
	if err != nil {
		return "", err
	}

	// Generate new token with updated expiry
	user := &User{
		ID:       claims.UserID,
		Username: claims.Username,
		Roles:    claims.Roles,
	}

	return s.generateToken(user)
}

func (s *Service) generateToken(user *User) (string, error) {
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Roles:    user.Roles,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(s.tokenTTL).Unix(),
			IssuedAt:  time.Now().Unix(),
			Issuer:    "uars-cads",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *Service) verifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *Service) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// Mock implementation - in production this would connect to a database
func (s *Service) getUserByUsername(username string) (*User, error) {
	// Mock user data
	hashedPassword, _ := s.HashPassword("password123")

	mockUsers := map[string]*User{
		"admin": {
			ID:       "user-1",
			Username: "admin",
			Email:    "admin@uars7.com",
			Password: hashedPassword,
			Roles:    []string{"admin", "user"},
			Active:   true,
		},
		"user": {
			ID:       "user-2",
			Username: "user",
			Email:    "user@uars7.com",
			Password: hashedPassword,
			Roles:    []string{"user"},
			Active:   true,
		},
	}

	user, exists := mockUsers[username]
	if !exists {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (s *Service) GenerateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
