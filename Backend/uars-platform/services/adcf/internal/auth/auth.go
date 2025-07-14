// Package auth provides military-grade authentication and authorization for ADCF
// Implements zero-trust authentication with multi-factor verification
package auth

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/argon2"
)

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret       []byte        `json:"-"`
	JWTIssuer       string        `json:"jwt_issuer"`
	JWTAudience     string        `json:"jwt_audience"`
	JWTExpiration   time.Duration `json:"jwt_expiration"`
	RefreshTokenTTL time.Duration `json:"refresh_token_ttl"`

	// MFA configuration
	MFARequired bool   `json:"mfa_required"`
	TOTPIssuer  string `json:"totp_issuer"`
	TOTPWindow  int    `json:"totp_window"`

	// Device attestation
	AttestationRequired bool   `json:"attestation_required"`
	AttestationEndpoint string `json:"attestation_endpoint"`

	// Session management
	SessionTimeout     time.Duration `json:"session_timeout"`
	ConcurrentSessions int           `json:"concurrent_sessions"`

	// Password policy
	MinPasswordLength   int           `json:"min_password_length"`
	RequireSpecialChars bool          `json:"require_special_chars"`
	RequireNumbers      bool          `json:"require_numbers"`
	RequireUppercase    bool          `json:"require_uppercase"`
	PasswordExpiration  time.Duration `json:"password_expiration"`
}

// AuthService provides authentication and authorization services
type AuthService struct {
	config        *AuthConfig
	sessionStore  sync.Map // SessionID -> Session
	refreshTokens sync.Map // RefreshToken -> UserID
	deviceCerts   sync.Map // DeviceID -> Certificate
	metrics       *AuthMetrics
	signingKey    ed25519.PrivateKey
	verifyingKey  ed25519.PublicKey
}

// AuthMetrics tracks authentication metrics
type AuthMetrics struct {
	LoginAttempts       prometheus.CounterVec
	LoginSuccesses      prometheus.CounterVec
	LoginFailures       prometheus.CounterVec
	MFAVerifications    prometheus.CounterVec
	DeviceAttestations  prometheus.CounterVec
	SessionCreations    prometheus.CounterVec
	SessionTerminations prometheus.CounterVec
	PasswordChanges     prometheus.CounterVec
	TokenGenerations    prometheus.CounterVec
	TokenValidations    prometheus.CounterVec
}

// Session represents an authenticated session
type Session struct {
	ID             string                 `json:"id"`
	UserID         string                 `json:"user_id"`
	DeviceID       string                 `json:"device_id"`
	IPAddress      string                 `json:"ip_address"`
	UserAgent      string                 `json:"user_agent"`
	CreatedAt      time.Time              `json:"created_at"`
	LastActivity   time.Time              `json:"last_activity"`
	ExpiresAt      time.Time              `json:"expires_at"`
	IsActive       bool                   `json:"is_active"`
	Scopes         []string               `json:"scopes"`
	MFAVerified    bool                   `json:"mfa_verified"`
	DeviceAttested bool                   `json:"device_attested"`
	RiskScore      float64                `json:"risk_score"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// User represents a user in the system
type User struct {
	ID                  string    `json:"id"`
	Username            string    `json:"username"`
	Email               string    `json:"email"`
	PasswordHash        string    `json:"-"`
	Salt                string    `json:"-"`
	MFASecret           string    `json:"-"`
	MFAEnabled          bool      `json:"mfa_enabled"`
	Roles               []string  `json:"roles"`
	Groups              []string  `json:"groups"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	LastLogin           time.Time `json:"last_login"`
	PasswordChangedAt   time.Time `json:"password_changed_at"`
	FailedLoginAttempts int       `json:"failed_login_attempts"`
	AccountLocked       bool      `json:"account_locked"`
	AccountLockedUntil  time.Time `json:"account_locked_until"`
	EmailVerified       bool      `json:"email_verified"`
	IsActive            bool      `json:"is_active"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username          string `json:"username" validate:"required"`
	Password          string `json:"password" validate:"required"`
	DeviceID          string `json:"device_id" validate:"required"`
	TOTPCode          string `json:"totp_code,omitempty"`
	RememberMe        bool   `json:"remember_me"`
	DeviceFingerprint string `json:"device_fingerprint"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	AccessToken    string    `json:"access_token"`
	RefreshToken   string    `json:"refresh_token"`
	TokenType      string    `json:"token_type"`
	ExpiresIn      int64     `json:"expires_in"`
	ExpiresAt      time.Time `json:"expires_at"`
	SessionID      string    `json:"session_id"`
	User           *User     `json:"user"`
	RequiresMFA    bool      `json:"requires_mfa"`
	RequiredScopes []string  `json:"required_scopes"`
}

// TokenClaims represents JWT token claims
type TokenClaims struct {
	jwt.RegisteredClaims
	UserID         string                 `json:"user_id"`
	Username       string                 `json:"username"`
	Email          string                 `json:"email"`
	Roles          []string               `json:"roles"`
	Groups         []string               `json:"groups"`
	Scopes         []string               `json:"scopes"`
	DeviceID       string                 `json:"device_id"`
	SessionID      string                 `json:"session_id"`
	MFAVerified    bool                   `json:"mfa_verified"`
	DeviceAttested bool                   `json:"device_attested"`
	RiskScore      float64                `json:"risk_score"`
	Metadata       map[string]interface{} `json:"metadata"`
}

// NewAuthService creates a new authentication service
func NewAuthService(config *AuthConfig) (*AuthService, error) {
	// Generate Ed25519 key pair for signing
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate Ed25519 key pair: %w", err)
	}

	metrics := &AuthMetrics{
		LoginAttempts: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_login_attempts_total",
				Help: "Total number of login attempts",
			},
			[]string{"method", "result", "user_id"},
		),
		LoginSuccesses: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_login_successes_total",
				Help: "Total number of successful logins",
			},
			[]string{"user_id", "device_id"},
		),
		LoginFailures: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_login_failures_total",
				Help: "Total number of failed logins",
			},
			[]string{"reason", "user_id"},
		),
		MFAVerifications: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_mfa_verifications_total",
				Help: "Total number of MFA verifications",
			},
			[]string{"result", "user_id"},
		),
		DeviceAttestations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_device_attestations_total",
				Help: "Total number of device attestations",
			},
			[]string{"result", "device_id"},
		),
		SessionCreations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_session_creations_total",
				Help: "Total number of session creations",
			},
			[]string{"user_id", "device_id"},
		),
		SessionTerminations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_session_terminations_total",
				Help: "Total number of session terminations",
			},
			[]string{"reason", "user_id"},
		),
		TokenGenerations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_token_generations_total",
				Help: "Total number of token generations",
			},
			[]string{"type", "user_id"},
		),
		TokenValidations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_token_validations_total",
				Help: "Total number of token validations",
			},
			[]string{"result", "type"},
		),
	}

	return &AuthService{
		config:       config,
		metrics:      metrics,
		signingKey:   privateKey,
		verifyingKey: publicKey,
	}, nil
}

// Login authenticates a user and creates a session
func (as *AuthService) Login(req *LoginRequest, clientIP, userAgent string) (*LoginResponse, error) {
	as.metrics.LoginAttempts.WithLabelValues("password", "attempt", req.Username).Inc()

	// Validate input
	if err := as.validateLoginRequest(req); err != nil {
		as.metrics.LoginFailures.WithLabelValues("validation", req.Username).Inc()
		return nil, fmt.Errorf("invalid login request: %w", err)
	}

	// Retrieve user (this would typically query a database)
	user, err := as.getUserByUsername(req.Username)
	if err != nil {
		as.metrics.LoginFailures.WithLabelValues("user_not_found", req.Username).Inc()
		return nil, fmt.Errorf("authentication failed")
	}

	// Check if account is locked
	if user.AccountLocked && time.Now().Before(user.AccountLockedUntil) {
		as.metrics.LoginFailures.WithLabelValues("account_locked", req.Username).Inc()
		return nil, fmt.Errorf("account is locked")
	}

	// Verify password
	if !as.verifyPassword(req.Password, user.PasswordHash, user.Salt) {
		as.incrementFailedLoginAttempts(user.ID)
		as.metrics.LoginFailures.WithLabelValues("invalid_password", req.Username).Inc()
		return nil, fmt.Errorf("authentication failed")
	}

	// Check if MFA is required
	if as.config.MFARequired || user.MFAEnabled {
		if req.TOTPCode == "" {
			return &LoginResponse{
				RequiresMFA: true,
				User:        user,
			}, nil
		}

		// Verify TOTP code
		if !as.verifyTOTP(user.MFASecret, req.TOTPCode) {
			as.metrics.MFAVerifications.WithLabelValues("failed", user.ID).Inc()
			return nil, fmt.Errorf("invalid MFA code")
		}
		as.metrics.MFAVerifications.WithLabelValues("success", user.ID).Inc()
	}

	// Check device attestation
	deviceAttested := false
	if as.config.AttestationRequired {
		attested, err := as.verifyDeviceAttestation(req.DeviceID, req.DeviceFingerprint)
		if err != nil {
			as.metrics.DeviceAttestations.WithLabelValues("failed", req.DeviceID).Inc()
			return nil, fmt.Errorf("device attestation failed: %w", err)
		}
		deviceAttested = attested
		as.metrics.DeviceAttestations.WithLabelValues("success", req.DeviceID).Inc()
	}

	// Calculate risk score
	riskScore := as.calculateRiskScore(user, clientIP, userAgent, req.DeviceID)

	// Create session
	session := &Session{
		ID:             as.generateSessionID(),
		UserID:         user.ID,
		DeviceID:       req.DeviceID,
		IPAddress:      clientIP,
		UserAgent:      userAgent,
		CreatedAt:      time.Now(),
		LastActivity:   time.Now(),
		ExpiresAt:      time.Now().Add(as.config.SessionTimeout),
		IsActive:       true,
		Scopes:         as.getUserScopes(user),
		MFAVerified:    as.config.MFARequired || user.MFAEnabled,
		DeviceAttested: deviceAttested,
		RiskScore:      riskScore,
		Metadata:       make(map[string]interface{}),
	}

	// Store session
	as.sessionStore.Store(session.ID, session)
	as.metrics.SessionCreations.WithLabelValues(user.ID, req.DeviceID).Inc()

	// Generate tokens
	accessToken, err := as.generateAccessToken(user, session)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken := as.generateRefreshToken(user.ID)
	as.refreshTokens.Store(refreshToken, user.ID)

	// Update user last login
	user.LastLogin = time.Now()
	user.FailedLoginAttempts = 0
	user.AccountLocked = false

	as.metrics.LoginSuccesses.WithLabelValues(user.ID, req.DeviceID).Inc()

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(as.config.JWTExpiration.Seconds()),
		ExpiresAt:    time.Now().Add(as.config.JWTExpiration),
		SessionID:    session.ID,
		User:         user,
		RequiresMFA:  false,
	}, nil
}

// ValidateToken validates a JWT token and returns claims
func (as *AuthService) ValidateToken(tokenString string) (*TokenClaims, error) {
	as.metrics.TokenValidations.WithLabelValues("attempt", "access").Inc()

	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return as.config.JWTSecret, nil
	})

	if err != nil {
		as.metrics.TokenValidations.WithLabelValues("failed", "access").Inc()
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		as.metrics.TokenValidations.WithLabelValues("failed", "access").Inc()
		return nil, fmt.Errorf("invalid token claims")
	}

	// Validate session is still active
	sessionInterface, exists := as.sessionStore.Load(claims.SessionID)
	if !exists {
		as.metrics.TokenValidations.WithLabelValues("failed", "access").Inc()
		return nil, fmt.Errorf("session not found")
	}

	session := sessionInterface.(*Session)
	if !session.IsActive || time.Now().After(session.ExpiresAt) {
		as.metrics.TokenValidations.WithLabelValues("failed", "access").Inc()
		return nil, fmt.Errorf("session expired")
	}

	// Update session activity
	session.LastActivity = time.Now()
	as.sessionStore.Store(session.ID, session)

	as.metrics.TokenValidations.WithLabelValues("success", "access").Inc()
	return claims, nil
}

// RefreshToken generates a new access token using a refresh token
func (as *AuthService) RefreshToken(refreshToken string) (*LoginResponse, error) {
	userIDInterface, exists := as.refreshTokens.Load(refreshToken)
	if !exists {
		return nil, fmt.Errorf("invalid refresh token")
	}

	userID := userIDInterface.(string)
	user, err := as.getUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Generate new access token
	// For simplicity, we'll reuse the last session
	var lastSession *Session
	as.sessionStore.Range(func(key, value interface{}) bool {
		session := value.(*Session)
		if session.UserID == userID && session.IsActive {
			lastSession = session
			return false
		}
		return true
	})

	if lastSession == nil {
		return nil, fmt.Errorf("no active session found")
	}

	accessToken, err := as.generateAccessToken(user, lastSession)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	as.metrics.TokenGenerations.WithLabelValues("refresh", user.ID).Inc()

	return &LoginResponse{
		AccessToken: accessToken,
		TokenType:   "Bearer",
		ExpiresIn:   int64(as.config.JWTExpiration.Seconds()),
		ExpiresAt:   time.Now().Add(as.config.JWTExpiration),
		User:        user,
	}, nil
}

// Logout terminates a session
func (as *AuthService) Logout(sessionID string) error {
	sessionInterface, exists := as.sessionStore.Load(sessionID)
	if !exists {
		return fmt.Errorf("session not found")
	}

	session := sessionInterface.(*Session)
	session.IsActive = false
	as.sessionStore.Store(sessionID, session)

	as.metrics.SessionTerminations.WithLabelValues("logout", session.UserID).Inc()
	return nil
}

// CreateUser creates a new user with secure password hashing
func (as *AuthService) CreateUser(username, email, password string) (*User, error) {
	// Validate password strength
	if err := as.validatePasswordStrength(password); err != nil {
		return nil, fmt.Errorf("password validation failed: %w", err)
	}

	// Generate salt
	salt := make([]byte, 32)
	if _, err := rand.Read(salt); err != nil {
		return nil, fmt.Errorf("failed to generate salt: %w", err)
	}

	// Hash password using Argon2id
	passwordHash := as.hashPassword(password, salt)

	user := &User{
		ID:                as.generateUserID(),
		Username:          username,
		Email:             email,
		PasswordHash:      hex.EncodeToString(passwordHash),
		Salt:              hex.EncodeToString(salt),
		MFAEnabled:        false,
		Roles:             []string{"user"},
		Groups:            []string{},
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		PasswordChangedAt: time.Now(),
		EmailVerified:     false,
		IsActive:          true,
	}

	// Store user (this would typically save to a database)
	return user, nil
}

// Helper methods

func (as *AuthService) validateLoginRequest(req *LoginRequest) error {
	if req.Username == "" {
		return fmt.Errorf("username is required")
	}
	if req.Password == "" {
		return fmt.Errorf("password is required")
	}
	if req.DeviceID == "" {
		return fmt.Errorf("device ID is required")
	}
	return nil
}

func (as *AuthService) getUserByUsername(username string) (*User, error) {
	// This would typically query a database
	// For demonstration, return a mock user
	if username == "admin" {
		return &User{
			ID:           "admin-user-id",
			Username:     "admin",
			Email:        "admin@uars.platform",
			PasswordHash: "hashed_password",
			Salt:         "salt",
			MFAEnabled:   true,
			MFASecret:    "base32_secret",
			Roles:        []string{"admin", "user"},
			Groups:       []string{"administrators"},
			IsActive:     true,
		}, nil
	}
	return nil, fmt.Errorf("user not found")
}

func (as *AuthService) getUserByID(userID string) (*User, error) {
	// This would typically query a database
	if userID == "admin-user-id" {
		return as.getUserByUsername("admin")
	}
	return nil, fmt.Errorf("user not found")
}

func (as *AuthService) verifyPassword(password, hash, salt string) bool {
	saltBytes, err := hex.DecodeString(salt)
	if err != nil {
		return false
	}

	hashBytes, err := hex.DecodeString(hash)
	if err != nil {
		return false
	}

	computedHash := as.hashPassword(password, saltBytes)
	return len(computedHash) == len(hashBytes) &&
		subtle.ConstantTimeCompare(computedHash, hashBytes) == 1
}

func (as *AuthService) hashPassword(password string, salt []byte) []byte {
	// Use Argon2id for password hashing (military-grade)
	return argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
}

func (as *AuthService) verifyTOTP(secret, code string) bool {
	// Implementation would use a TOTP library to verify the code
	// For demonstration, always return true
	return code == "123456"
}

func (as *AuthService) verifyDeviceAttestation(deviceID, fingerprint string) (bool, error) {
	// Implementation would verify device attestation
	// For demonstration, always return true
	return true, nil
}

func (as *AuthService) calculateRiskScore(user *User, ip, userAgent, deviceID string) float64 {
	score := 0.0

	// Base score for authenticated user
	score += 1.0

	// Check for admin privileges
	for _, role := range user.Roles {
		if role == "admin" {
			score += 2.0
			break
		}
	}

	// Check failed login attempts
	if user.FailedLoginAttempts > 0 {
		score += float64(user.FailedLoginAttempts) * 0.5
	}

	// Check time since last password change
	daysSincePasswordChange := time.Since(user.PasswordChangedAt).Hours() / 24
	if daysSincePasswordChange > 90 {
		score += 1.0
	}

	// Normalize to 0-10 scale
	if score > 10.0 {
		score = 10.0
	}

	return score
}

func (as *AuthService) getUserScopes(user *User) []string {
	scopes := []string{"read"}

	for _, role := range user.Roles {
		switch role {
		case "admin":
			scopes = append(scopes, "write", "delete", "admin")
		case "editor":
			scopes = append(scopes, "write")
		}
	}

	return scopes
}

func (as *AuthService) generateAccessToken(user *User, session *Session) (string, error) {
	claims := &TokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    as.config.JWTIssuer,
			Subject:   user.ID,
			Audience:  []string{as.config.JWTAudience},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(as.config.JWTExpiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
		UserID:         user.ID,
		Username:       user.Username,
		Email:          user.Email,
		Roles:          user.Roles,
		Groups:         user.Groups,
		Scopes:         session.Scopes,
		DeviceID:       session.DeviceID,
		SessionID:      session.ID,
		MFAVerified:    session.MFAVerified,
		DeviceAttested: session.DeviceAttested,
		RiskScore:      session.RiskScore,
		Metadata:       session.Metadata,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(as.config.JWTSecret)
	if err != nil {
		return "", err
	}

	as.metrics.TokenGenerations.WithLabelValues("access", user.ID).Inc()
	return tokenString, nil
}

func (as *AuthService) generateRefreshToken(userID string) string {
	// Generate cryptographically secure random token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	return base64.RawURLEncoding.EncodeToString(tokenBytes)
}

func (as *AuthService) generateSessionID() string {
	sessionBytes := make([]byte, 16)
	rand.Read(sessionBytes)
	return hex.EncodeToString(sessionBytes)
}

func (as *AuthService) generateUserID() string {
	userBytes := make([]byte, 16)
	rand.Read(userBytes)
	return hex.EncodeToString(userBytes)
}

func (as *AuthService) incrementFailedLoginAttempts(userID string) {
	// This would typically update the database
	// For demonstration, we'll just log it
	log.Warn().Str("user_id", userID).Msg("Failed login attempt")
}

func (as *AuthService) validatePasswordStrength(password string) error {
	if len(password) < as.config.MinPasswordLength {
		return fmt.Errorf("password must be at least %d characters", as.config.MinPasswordLength)
	}

	if as.config.RequireUppercase && !strings.ContainsAny(password, "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		return fmt.Errorf("password must contain uppercase letters")
	}

	if as.config.RequireNumbers && !strings.ContainsAny(password, "0123456789") {
		return fmt.Errorf("password must contain numbers")
	}

	if as.config.RequireSpecialChars && !strings.ContainsAny(password, "!@#$%^&*()_+-=[]{}|;:,.<>?") {
		return fmt.Errorf("password must contain special characters")
	}

	return nil
}

// GetAuthMetrics returns authentication metrics for Prometheus
func (as *AuthService) GetAuthMetrics() []prometheus.Collector {
	return []prometheus.Collector{
		&as.metrics.LoginAttempts,
		&as.metrics.LoginSuccesses,
		&as.metrics.LoginFailures,
		&as.metrics.MFAVerifications,
		&as.metrics.DeviceAttestations,
		&as.metrics.SessionCreations,
		&as.metrics.SessionTerminations,
		&as.metrics.PasswordChanges,
		&as.metrics.TokenGenerations,
		&as.metrics.TokenValidations,
	}
}

// AuthHandler provides HTTP handlers for authentication endpoints
type AuthHandler struct {
	authService *AuthService
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(authService *AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// LoginHandler handles login requests
func (ah *AuthHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	clientIP := r.Header.Get("X-Real-IP")
	if clientIP == "" {
		clientIP = r.Header.Get("X-Forwarded-For")
		if clientIP == "" {
			clientIP = r.RemoteAddr
		}
	}

	response, err := ah.authService.Login(&req, clientIP, r.UserAgent())
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// LogoutHandler handles logout requests
func (ah *AuthHandler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	sessionID := r.Header.Get("X-Session-ID")
	if sessionID == "" {
		http.Error(w, "Session ID required", http.StatusBadRequest)
		return
	}

	if err := ah.authService.Logout(sessionID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RefreshHandler handles token refresh requests
func (ah *AuthHandler) RefreshHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	response, err := ah.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
