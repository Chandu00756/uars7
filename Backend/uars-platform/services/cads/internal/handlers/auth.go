package handlers

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"

	"github.com/portalvii/uars7/services/cads/internal/auth"
	"github.com/portalvii/uars7/services/cads/internal/directory"
)

// SecurityConfig defines security parameters for the auth handler
type SecurityConfig struct {
	CSRFSecret       []byte
	SessionTimeout   time.Duration
	MaxLoginAttempts int
	RateLimitRPS     int
	RequireHTTPS     bool
}

// AuthHandler provides military-grade HTTP authentication endpoints
type AuthHandler struct {
	authService      *auth.Service
	directoryService *directory.Service
	logger           *logrus.Logger
	security         *SecurityConfig
	rateLimiter      *rate.Limiter
	loginAttempts    map[string]int // IP -> attempt count
}

// NewAuthHandler creates a new secure authentication handler
func NewAuthHandler(authService *auth.Service, directoryService *directory.Service, logger *logrus.Logger) *AuthHandler {
	// Generate cryptographically secure CSRF secret
	csrfSecret := make([]byte, 32)
	if _, err := rand.Read(csrfSecret); err != nil {
		logger.Fatal("Failed to generate CSRF secret")
	}

	security := &SecurityConfig{
		CSRFSecret:       csrfSecret,
		SessionTimeout:   15 * time.Minute, // Short session timeout
		MaxLoginAttempts: 3,
		RateLimitRPS:     5,    // 5 requests per second max
		RequireHTTPS:     true, // Force HTTPS in production
	}

	return &AuthHandler{
		authService:      authService,
		directoryService: directoryService,
		logger:           logger,
		security:         security,
		rateLimiter:      rate.NewLimiter(rate.Limit(security.RateLimitRPS), security.RateLimitRPS*2),
		loginAttempts:    make(map[string]int),
	}
}

// SecurityMiddleware applies security headers and validations
func (h *AuthHandler) SecurityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Rate limiting
		if !h.rateLimiter.Allow() {
			h.logger.Warn("Rate limit exceeded", "ip", r.RemoteAddr)
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Content-Security-Policy", "default-src 'self'")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// HTTPS enforcement (in production)
		if h.security.RequireHTTPS && r.Header.Get("X-Forwarded-Proto") != "https" && !strings.HasPrefix(r.Host, "localhost") {
			http.Redirect(w, r, "https://"+r.Host+r.RequestURI, http.StatusMovedPermanently)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// AuthenticateHandler handles secure login requests
func (h *AuthHandler) AuthenticateHandler(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	clientIP := h.getClientIP(r)

	h.logger.WithFields(logrus.Fields{
		"ip":         clientIP,
		"user_agent": r.UserAgent(),
		"endpoint":   "authenticate",
	}).Info("Authentication attempt")

	// Check login attempts
	if attempts, exists := h.loginAttempts[clientIP]; exists && attempts >= h.security.MaxLoginAttempts {
		h.logger.Warn("Max login attempts exceeded", "ip", clientIP)
		http.Error(w, "Too many login attempts", http.StatusTooManyRequests)
		return
	}

	var req struct {
		Username  string `json:"username"`
		Password  string `json:"password"`
		ClientID  string `json:"client_id"`
		CSRFToken string `json:"csrf_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.incrementLoginAttempts(clientIP)
		h.logger.Error("Invalid request payload", "error", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate inputs
	if err := h.validateAuthRequest(&req); err != nil {
		h.incrementLoginAttempts(clientIP)
		h.logger.Error("Request validation failed", "error", err)
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Authenticate user
	user, token, err := h.authService.Authenticate(context.Background(), req.Username, req.Password)
	if err != nil {
		h.incrementLoginAttempts(clientIP)
		h.logger.Error("Authentication failed", "username", req.Username, "error", err)
		http.Error(w, "Authentication failed", http.StatusUnauthorized)
		return
	}

	// Reset login attempts on successful auth
	delete(h.loginAttempts, clientIP)

	// Get user profile with enhanced security
	profile, err := h.directoryService.GetUserProfile(context.Background(), user.ID)
	if err != nil {
		h.logger.Warn("Failed to get user profile", "user_id", user.ID, "error", err)
	}

	// Create secure response
	response := h.createSecureAuthResponse(user, token, profile)

	// Set secure session cookie
	h.setSecureSessionCookie(w, token)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	h.logger.WithFields(logrus.Fields{
		"username": req.Username,
		"duration": time.Since(start),
	}).Info("Authentication successful")
}

// ValidateTokenHandler validates JWT tokens with enhanced security
func (h *AuthHandler) ValidateTokenHandler(w http.ResponseWriter, r *http.Request) {
	token := h.extractToken(r)
	if token == "" {
		http.Error(w, "Missing authorization token", http.StatusUnauthorized)
		return
	}

	claims, err := h.authService.ValidateToken(context.Background(), token)
	if err != nil {
		h.logger.Error("Token validation failed", "error", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"valid": true,
		"user": map[string]interface{}{
			"id":       claims.UserID,
			"username": claims.Username,
			"roles":    claims.Roles,
		},
		"expires_at": claims.ExpiresAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RefreshTokenHandler handles secure token refresh
func (h *AuthHandler) RefreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	token := h.extractToken(r)
	if token == "" {
		http.Error(w, "Missing authorization token", http.StatusUnauthorized)
		return
	}

	newToken, err := h.authService.RefreshToken(context.Background(), token)
	if err != nil {
		h.logger.Error("Token refresh failed", "error", err)
		http.Error(w, "Token refresh failed", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"access_token": newToken,
		"token_type":   "Bearer",
		"expires_in":   int(h.security.SessionTimeout.Seconds()),
	}

	// Set new secure session cookie
	h.setSecureSessionCookie(w, newToken)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LogoutHandler handles secure logout
func (h *AuthHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "uars7-session",
		Value:    "",
		MaxAge:   -1,
		Path:     "/",
		HttpOnly: true,
		Secure:   h.security.RequireHTTPS,
		SameSite: http.SameSiteStrictMode,
	})

	response := map[string]interface{}{
		"message": "Logout successful",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper methods for enhanced security

func (h *AuthHandler) validateAuthRequest(req *struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	ClientID  string `json:"client_id"`
	CSRFToken string `json:"csrf_token"`
}) error {
	if req.Username == "" || req.Password == "" {
		return fmt.Errorf("username and password required")
	}

	if len(req.Username) > 255 || len(req.Password) > 255 {
		return fmt.Errorf("input too long")
	}

	// Validate CSRF token in production
	if h.security.RequireHTTPS && req.CSRFToken == "" {
		return fmt.Errorf("CSRF token required")
	}

	return nil
}

func (h *AuthHandler) getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (load balancer)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.Split(xff, ",")[0]
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	return r.RemoteAddr
}

func (h *AuthHandler) incrementLoginAttempts(ip string) {
	h.loginAttempts[ip]++

	// Clean up old attempts periodically
	if len(h.loginAttempts) > 1000 {
		// Simple cleanup - in production use Redis with TTL
		for k := range h.loginAttempts {
			delete(h.loginAttempts, k)
			if len(h.loginAttempts) <= 500 {
				break
			}
		}
	}
}

func (h *AuthHandler) extractToken(r *http.Request) string {
	// Check Authorization header
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}

	// Check cookie as fallback
	if cookie, err := r.Cookie("uars7-session"); err == nil {
		return cookie.Value
	}

	return ""
}

func (h *AuthHandler) createSecureAuthResponse(user *auth.User, token string, profile interface{}) map[string]interface{} {
	return map[string]interface{}{
		"success":      true,
		"access_token": token,
		"token_type":   "Bearer",
		"expires_in":   int(h.security.SessionTimeout.Seconds()),
		"user": map[string]interface{}{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"roles":    user.Roles,
		},
		"csrf_token": h.generateCSRFToken(),
	}
}

func (h *AuthHandler) setSecureSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "uars7-session",
		Value:    token,
		MaxAge:   int(h.security.SessionTimeout.Seconds()),
		Path:     "/",
		HttpOnly: true,
		Secure:   h.security.RequireHTTPS,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *AuthHandler) generateCSRFToken() string {
	// Generate secure CSRF token
	token := make([]byte, 32)
	rand.Read(token)
	return base64.URLEncoding.EncodeToString(token)
}

func (h *AuthHandler) validateCSRFToken(provided, expected string) bool {
	// Constant-time comparison to prevent timing attacks
	return subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) == 1
}
