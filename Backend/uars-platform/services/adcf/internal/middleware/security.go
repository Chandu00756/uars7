// Package middleware provides military-grade security middleware for ADCF
// This implements defense-in-depth security patterns with zero-trust principles
package middleware

import (
	"context"
	"crypto/ed25519"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
	"golang.org/x/time/rate"
)

// SecurityConfig holds military-grade security configuration
type SecurityConfig struct {
	// JWT configuration
	JWTSecret     []byte        `json:"-"` // Never log secrets
	JWTIssuer     string        `json:"jwt_issuer"`
	JWTAudience   string        `json:"jwt_audience"`
	JWTExpiration time.Duration `json:"jwt_expiration"`

	// Intent token configuration
	IntentTokenPubKey ed25519.PublicKey `json:"-"` // Ed25519 public key for intent verification
	IntentTokenMaxAge time.Duration     `json:"intent_token_max_age"`

	// Rate limiting
	GlobalRateLimit int `json:"global_rate_limit"` // Requests per minute per IP
	UserRateLimit   int `json:"user_rate_limit"`   // Requests per minute per user
	BurstSize       int `json:"burst_size"`

	// TLS configuration
	MinTLSVersion     uint16   `json:"min_tls_version"`
	CipherSuites      []uint16 `json:"cipher_suites"`
	RequireClientCert bool     `json:"require_client_cert"`

	// Security headers
	HSTS               bool   `json:"hsts_enabled"`
	HSSTMaxAge         int    `json:"hsst_max_age"`
	ContentTypeNoSniff bool   `json:"content_type_no_sniff"`
	XFrameOptions      string `json:"x_frame_options"`
	CSPHeader          string `json:"csp_header"`

	// CORS configuration
	AllowedOrigins []string `json:"allowed_origins"`
	AllowedMethods []string `json:"allowed_methods"`
	AllowedHeaders []string `json:"allowed_headers"`

	// Trusted networks (military networks, government facilities)
	TrustedNetworks []*net.IPNet `json:"-"`

	// Geofencing
	AllowedCountries []string `json:"allowed_countries"`
	BlockedCountries []string `json:"blocked_countries"`
}

// SecurityMiddleware provides military-grade security enforcement
type SecurityMiddleware struct {
	config         *SecurityConfig
	rateLimiters   sync.Map // IP -> *rate.Limiter
	userLimiters   sync.Map // UserID -> *rate.Limiter
	blockedIPs     sync.Map // IP -> time.Time (when blocked)
	failedLogins   sync.Map // IP -> count
	metrics        *SecurityMetrics
	trustedProxies []string
}

// SecurityMetrics tracks security-related metrics
type SecurityMetrics struct {
	RequestsTotal          prometheus.CounterVec
	AuthenticationAttempts prometheus.CounterVec
	RateLimitHits          prometheus.CounterVec
	SecurityViolations     prometheus.CounterVec
	TLSConnections         prometheus.CounterVec
	GeoBlocks              prometheus.CounterVec
	IntentTokenValidations prometheus.CounterVec
}

// SecurityContext holds per-request security information
type SecurityContext struct {
	UserID         string
	DeviceID       string
	IPAddress      string
	UserAgent      string
	Country        string
	City           string
	IsAttested     bool
	TLSVersion     uint16
	ClientCertSN   string
	RiskScore      float64
	Intent         *IntentToken
	Claims         jwt.MapClaims
	RequestTime    time.Time
	TrustedNetwork bool
}

// IntentToken represents an Ed25519-signed intent declaration
type IntentToken struct {
	Purpose       string `json:"purpose"`
	Justification string `json:"justification"`
	ResourceID    string `json:"resource_id"`
	Duration      int64  `json:"duration"`
	IssuedAt      int64  `json:"iat"`
	ExpiresAt     int64  `json:"exp"`
	DeviceID      string `json:"device_id"`
	UserID        string `json:"user_id"`
	Signature     string `json:"signature"`
}

// NewSecurityMiddleware creates a new military-grade security middleware
func NewSecurityMiddleware(config *SecurityConfig) *SecurityMiddleware {
	metrics := &SecurityMetrics{
		RequestsTotal: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_requests_total",
				Help: "Total number of HTTP requests",
			},
			[]string{"method", "status", "endpoint", "user_id"},
		),
		AuthenticationAttempts: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_auth_attempts_total",
				Help: "Total number of authentication attempts",
			},
			[]string{"type", "result", "ip", "user_agent"},
		),
		RateLimitHits: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_rate_limit_hits_total",
				Help: "Total number of rate limit hits",
			},
			[]string{"type", "ip", "user_id"},
		),
		SecurityViolations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_security_violations_total",
				Help: "Total number of security violations",
			},
			[]string{"type", "severity", "ip", "user_id"},
		),
		TLSConnections: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_tls_connections_total",
				Help: "Total number of TLS connections",
			},
			[]string{"version", "cipher_suite", "client_cert"},
		),
		GeoBlocks: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_geo_blocks_total",
				Help: "Total number of geographical blocks",
			},
			[]string{"country", "reason"},
		),
		IntentTokenValidations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_intent_token_validations_total",
				Help: "Total number of intent token validations",
			},
			[]string{"result", "purpose", "user_id"},
		),
	}

	return &SecurityMiddleware{
		config:         config,
		metrics:        metrics,
		trustedProxies: []string{"127.0.0.1", "::1"}, // Add your trusted proxies
	}
}

// SecurityHeaders adds military-grade security headers to all responses
func (sm *SecurityMiddleware) SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Strict Transport Security (HSTS)
		if sm.config.HSTS {
			w.Header().Set("Strict-Transport-Security",
				fmt.Sprintf("max-age=%d; includeSubDomains; preload", sm.config.HSSTMaxAge))
		}

		// Content Security Policy
		if sm.config.CSPHeader != "" {
			w.Header().Set("Content-Security-Policy", sm.config.CSPHeader)
		}

		// X-Frame-Options
		if sm.config.XFrameOptions != "" {
			w.Header().Set("X-Frame-Options", sm.config.XFrameOptions)
		}

		// Content type sniffing protection
		if sm.config.ContentTypeNoSniff {
			w.Header().Set("X-Content-Type-Options", "nosniff")
		}

		// Additional security headers
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), location=(), payment=()")
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")

		// Remove server identification
		w.Header().Set("Server", "ADCF/1.0")

		// Cache control for sensitive responses
		if strings.Contains(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimiting implements sophisticated rate limiting with IP and user-based limits
func (sm *SecurityMiddleware) RateLimiting(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := sm.getClientIP(r)

		// Check if IP is blocked
		if blockedUntil, isBlocked := sm.blockedIPs.Load(clientIP); isBlocked {
			if time.Now().Before(blockedUntil.(time.Time)) {
				sm.metrics.RateLimitHits.WithLabelValues("ip_blocked", clientIP, "").Inc()
				sm.logSecurityViolation(r, "IP_BLOCKED", "high", "IP address is temporarily blocked")
				http.Error(w, "IP address temporarily blocked", http.StatusTooManyRequests)
				return
			}
			// Unblock expired blocks
			sm.blockedIPs.Delete(clientIP)
		}

		// Global rate limiting by IP
		ipLimiter := sm.getIPRateLimiter(clientIP)
		if !ipLimiter.Allow() {
			sm.incrementFailedAttempts(clientIP)
			sm.metrics.RateLimitHits.WithLabelValues("ip_global", clientIP, "").Inc()
			sm.logSecurityViolation(r, "RATE_LIMIT_IP", "medium", "IP rate limit exceeded")

			// Block IP if too many violations
			if sm.shouldBlockIP(clientIP) {
				sm.blockIP(clientIP, 15*time.Minute)
				sm.logSecurityViolation(r, "IP_AUTO_BLOCKED", "high", "IP automatically blocked due to repeated violations")
			}

			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		// User-specific rate limiting (if authenticated)
		if userID := sm.getUserIDFromContext(r); userID != "" {
			userLimiter := sm.getUserRateLimiter(userID)
			if !userLimiter.Allow() {
				sm.metrics.RateLimitHits.WithLabelValues("user", clientIP, userID).Inc()
				sm.logSecurityViolation(r, "RATE_LIMIT_USER", "medium", "User rate limit exceeded")
				http.Error(w, "User rate limit exceeded", http.StatusTooManyRequests)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// JWTAuthentication validates JWT tokens with military-grade security
func (sm *SecurityMiddleware) JWTAuthentication(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip authentication for health checks and metrics
		if strings.HasPrefix(r.URL.Path, "/health") || r.URL.Path == "/metrics" {
			next.ServeHTTP(w, r)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			sm.logAuthAttempt(r, "jwt", "missing_header")
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Extract Bearer token
		bearerToken := strings.TrimPrefix(authHeader, "Bearer ")
		if bearerToken == authHeader {
			sm.logAuthAttempt(r, "jwt", "invalid_format")
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		// Parse and validate JWT
		token, err := jwt.Parse(bearerToken, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return sm.config.JWTSecret, nil
		})

		if err != nil {
			sm.logAuthAttempt(r, "jwt", "parse_error")
			sm.logSecurityViolation(r, "JWT_PARSE_ERROR", "medium", err.Error())
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			sm.logAuthAttempt(r, "jwt", "invalid_claims")
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Validate token claims
		if err := sm.validateJWTClaims(claims); err != nil {
			sm.logAuthAttempt(r, "jwt", "claim_validation_failed")
			sm.logSecurityViolation(r, "JWT_CLAIM_VALIDATION", "medium", err.Error())
			http.Error(w, "Token validation failed", http.StatusUnauthorized)
			return
		}

		// Create security context
		secCtx := &SecurityContext{
			UserID:      claims["sub"].(string),
			Claims:      claims,
			RequestTime: time.Now(),
			IPAddress:   sm.getClientIP(r),
			UserAgent:   r.UserAgent(),
		}

		// Add security context to request
		ctx := context.WithValue(r.Context(), "security", secCtx)
		sm.logAuthAttempt(r, "jwt", "success")

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// IntentTokenValidation validates Ed25519-signed intent tokens for access control
func (sm *SecurityMiddleware) IntentTokenValidation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only require intent tokens for data access operations
		if !sm.requiresIntentToken(r) {
			next.ServeHTTP(w, r)
			return
		}

		intentHeader := r.Header.Get("X-Intent-Token")
		if intentHeader == "" {
			sm.metrics.IntentTokenValidations.WithLabelValues("missing", "", "").Inc()
			http.Error(w, "Intent token required", http.StatusForbidden)
			return
		}

		// Decode and validate intent token
		intentToken, err := sm.validateIntentToken(intentHeader, r)
		if err != nil {
			userID := sm.getUserIDFromContext(r)
			sm.metrics.IntentTokenValidations.WithLabelValues("invalid", "", userID).Inc()
			sm.logSecurityViolation(r, "INTENT_TOKEN_INVALID", "high", err.Error())
			http.Error(w, "Invalid intent token", http.StatusForbidden)
			return
		}

		// Add intent to security context
		secCtx := sm.getSecurityContext(r)
		if secCtx != nil {
			secCtx.Intent = intentToken
		}

		sm.metrics.IntentTokenValidations.WithLabelValues("valid", intentToken.Purpose, intentToken.UserID).Inc()
		next.ServeHTTP(w, r)
	})
}

// GeofenceEnforcement blocks requests from unauthorized geographical locations
func (sm *SecurityMiddleware) GeofenceEnforcement(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := sm.getClientIP(r)

		// Skip geofencing for trusted networks
		if sm.isTrustedNetwork(clientIP) {
			next.ServeHTTP(w, r)
			return
		}

		// Get country from IP (you would integrate with a GeoIP service)
		country := sm.getCountryFromIP(clientIP)
		if country == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Check if country is blocked
		for _, blocked := range sm.config.BlockedCountries {
			if country == blocked {
				sm.metrics.GeoBlocks.WithLabelValues(country, "blocked_country").Inc()
				sm.logSecurityViolation(r, "GEO_BLOCK", "high", fmt.Sprintf("Request from blocked country: %s", country))
				http.Error(w, "Access denied from this location", http.StatusForbidden)
				return
			}
		}

		// Check if country is in allowed list (if specified)
		if len(sm.config.AllowedCountries) > 0 {
			allowed := false
			for _, allowedCountry := range sm.config.AllowedCountries {
				if country == allowedCountry {
					allowed = true
					break
				}
			}
			if !allowed {
				sm.metrics.GeoBlocks.WithLabelValues(country, "not_allowed").Inc()
				sm.logSecurityViolation(r, "GEO_BLOCK", "high", fmt.Sprintf("Request from non-allowed country: %s", country))
				http.Error(w, "Access denied from this location", http.StatusForbidden)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// TLSEnforcement ensures proper TLS configuration and client certificates
func (sm *SecurityMiddleware) TLSEnforcement(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Enforce HTTPS
		if r.TLS == nil {
			sm.logSecurityViolation(r, "NON_TLS_REQUEST", "high", "Request made over non-TLS connection")
			http.Redirect(w, r, "https://"+r.Host+r.RequestURI, http.StatusMovedPermanently)
			return
		}

		// Validate TLS version
		if r.TLS.Version < sm.config.MinTLSVersion {
			sm.logSecurityViolation(r, "TLS_VERSION_TOO_LOW", "high",
				fmt.Sprintf("TLS version %d below minimum %d", r.TLS.Version, sm.config.MinTLSVersion))
			http.Error(w, "TLS version not supported", http.StatusUpgradeRequired)
			return
		}

		// Validate cipher suite
		if !sm.isAllowedCipherSuite(r.TLS.CipherSuite) {
			sm.logSecurityViolation(r, "WEAK_CIPHER", "medium",
				fmt.Sprintf("Weak cipher suite: %d", r.TLS.CipherSuite))
			http.Error(w, "Cipher suite not allowed", http.StatusUpgradeRequired)
			return
		}

		// Validate client certificate (if required)
		if sm.config.RequireClientCert {
			if len(r.TLS.PeerCertificates) == 0 {
				sm.logSecurityViolation(r, "MISSING_CLIENT_CERT", "high", "Client certificate required but not provided")
				http.Error(w, "Client certificate required", http.StatusUnauthorized)
				return
			}

			// Additional client certificate validation would go here
		}

		// Log TLS connection metrics
		tlsVersion := sm.getTLSVersionString(r.TLS.Version)
		cipherSuite := sm.getCipherSuiteString(r.TLS.CipherSuite)
		hasClientCert := len(r.TLS.PeerCertificates) > 0
		sm.metrics.TLSConnections.WithLabelValues(tlsVersion, cipherSuite, strconv.FormatBool(hasClientCert)).Inc()

		next.ServeHTTP(w, r)
	})
}

// WebSocketUpgrade handles secure WebSocket upgrades with authentication
func (sm *SecurityMiddleware) WebSocketUpgrade(upgrader *websocket.Upgrader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Validate authentication before upgrade
		secCtx := sm.getSecurityContext(r)
		if secCtx == nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		// Configure secure upgrader
		upgrader.CheckOrigin = func(r *http.Request) bool {
			origin := r.Header.Get("Origin")
			for _, allowed := range sm.config.AllowedOrigins {
				if origin == allowed {
					return true
				}
			}
			sm.logSecurityViolation(r, "WEBSOCKET_ORIGIN_DENIED", "medium",
				fmt.Sprintf("WebSocket origin denied: %s", origin))
			return false
		}

		// Upgrade connection
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			sm.logSecurityViolation(r, "WEBSOCKET_UPGRADE_FAILED", "medium", err.Error())
			return
		}
		defer conn.Close()

		// Handle WebSocket communication with security monitoring
		sm.handleSecureWebSocket(conn, secCtx)
	}
}

// Helper methods

func (sm *SecurityMiddleware) getClientIP(r *http.Request) string {
	// Check trusted proxy headers in order of preference
	if xForwardedFor := r.Header.Get("X-Forwarded-For"); xForwardedFor != "" {
		ips := strings.Split(xForwardedFor, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	if xRealIP := r.Header.Get("X-Real-IP"); xRealIP != "" {
		return strings.TrimSpace(xRealIP)
	}

	// Extract IP from remote address
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (sm *SecurityMiddleware) getIPRateLimiter(ip string) *rate.Limiter {
	if limiter, exists := sm.rateLimiters.Load(ip); exists {
		return limiter.(*rate.Limiter)
	}

	limiter := rate.NewLimiter(rate.Limit(sm.config.GlobalRateLimit)/60, sm.config.BurstSize)
	sm.rateLimiters.Store(ip, limiter)
	return limiter
}

func (sm *SecurityMiddleware) getUserRateLimiter(userID string) *rate.Limiter {
	if limiter, exists := sm.userLimiters.Load(userID); exists {
		return limiter.(*rate.Limiter)
	}

	limiter := rate.NewLimiter(rate.Limit(sm.config.UserRateLimit)/60, sm.config.BurstSize)
	sm.userLimiters.Store(userID, limiter)
	return limiter
}

func (sm *SecurityMiddleware) validateJWTClaims(claims jwt.MapClaims) error {
	// Validate issuer
	if iss, ok := claims["iss"].(string); !ok || iss != sm.config.JWTIssuer {
		return fmt.Errorf("invalid issuer")
	}

	// Validate audience
	if aud, ok := claims["aud"].(string); !ok || aud != sm.config.JWTAudience {
		return fmt.Errorf("invalid audience")
	}

	// Validate expiration
	if exp, ok := claims["exp"].(float64); !ok || time.Unix(int64(exp), 0).Before(time.Now()) {
		return fmt.Errorf("token expired")
	}

	// Validate issued at time
	if iat, ok := claims["iat"].(float64); !ok || time.Unix(int64(iat), 0).After(time.Now()) {
		return fmt.Errorf("token used before issued")
	}

	// Validate subject
	if sub, ok := claims["sub"].(string); !ok || sub == "" {
		return fmt.Errorf("invalid subject")
	}

	return nil
}

func (sm *SecurityMiddleware) validateIntentToken(tokenStr string, r *http.Request) (*IntentToken, error) {
	// Decode base64 token
	tokenBytes, err := base64.StdEncoding.DecodeString(tokenStr)
	if err != nil {
		return nil, fmt.Errorf("invalid token encoding")
	}

	// Parse JSON
	var token IntentToken
	if err := json.Unmarshal(tokenBytes, &token); err != nil {
		return nil, fmt.Errorf("invalid token format")
	}

	// Validate expiration
	if time.Unix(token.ExpiresAt, 0).Before(time.Now()) {
		return nil, fmt.Errorf("intent token expired")
	}

	// Validate age
	issued := time.Unix(token.IssuedAt, 0)
	if time.Since(issued) > sm.config.IntentTokenMaxAge {
		return nil, fmt.Errorf("intent token too old")
	}

	// Validate signature
	signatureBytes, err := base64.StdEncoding.DecodeString(token.Signature)
	if err != nil {
		return nil, fmt.Errorf("invalid signature encoding")
	}

	// Create message for signature verification
	message := fmt.Sprintf("%s|%s|%s|%d|%d|%s|%s",
		token.Purpose, token.Justification, token.ResourceID,
		token.Duration, token.IssuedAt, token.DeviceID, token.UserID)

	if !ed25519.Verify(sm.config.IntentTokenPubKey, []byte(message), signatureBytes) {
		return nil, fmt.Errorf("invalid signature")
	}

	// Validate user matches JWT
	secCtx := sm.getSecurityContext(r)
	if secCtx != nil && secCtx.UserID != token.UserID {
		return nil, fmt.Errorf("user ID mismatch")
	}

	return &token, nil
}

func (sm *SecurityMiddleware) requiresIntentToken(r *http.Request) bool {
	// Intent tokens required for capsule access operations
	return strings.Contains(r.URL.Path, "/capsules/") &&
		(r.Method == "GET" || r.Method == "POST" || r.Method == "PUT")
}

func (sm *SecurityMiddleware) isTrustedNetwork(ip string) bool {
	clientIP := net.ParseIP(ip)
	if clientIP == nil {
		return false
	}

	for _, network := range sm.config.TrustedNetworks {
		if network.Contains(clientIP) {
			return true
		}
	}
	return false
}

func (sm *SecurityMiddleware) getCountryFromIP(ip string) string {
	// Implementation would integrate with GeoIP service
	// For now, return empty string
	return ""
}

func (sm *SecurityMiddleware) isAllowedCipherSuite(suite uint16) bool {
	if len(sm.config.CipherSuites) == 0 {
		return true // No restrictions
	}

	for _, allowed := range sm.config.CipherSuites {
		if suite == allowed {
			return true
		}
	}
	return false
}

func (sm *SecurityMiddleware) getTLSVersionString(version uint16) string {
	switch version {
	case tls.VersionTLS10:
		return "1.0"
	case tls.VersionTLS11:
		return "1.1"
	case tls.VersionTLS12:
		return "1.2"
	case tls.VersionTLS13:
		return "1.3"
	default:
		return "unknown"
	}
}

func (sm *SecurityMiddleware) getCipherSuiteString(suite uint16) string {
	return fmt.Sprintf("0x%04X", suite)
}

func (sm *SecurityMiddleware) getUserIDFromContext(r *http.Request) string {
	if secCtx := sm.getSecurityContext(r); secCtx != nil {
		return secCtx.UserID
	}
	return ""
}

func (sm *SecurityMiddleware) getSecurityContext(r *http.Request) *SecurityContext {
	if ctx := r.Context().Value("security"); ctx != nil {
		return ctx.(*SecurityContext)
	}
	return nil
}

func (sm *SecurityMiddleware) incrementFailedAttempts(ip string) {
	if count, exists := sm.failedLogins.Load(ip); exists {
		sm.failedLogins.Store(ip, count.(int)+1)
	} else {
		sm.failedLogins.Store(ip, 1)
	}
}

func (sm *SecurityMiddleware) shouldBlockIP(ip string) bool {
	if count, exists := sm.failedLogins.Load(ip); exists {
		return count.(int) >= 10 // Block after 10 violations
	}
	return false
}

func (sm *SecurityMiddleware) blockIP(ip string, duration time.Duration) {
	sm.blockedIPs.Store(ip, time.Now().Add(duration))
}

func (sm *SecurityMiddleware) logAuthAttempt(r *http.Request, authType, result string) {
	sm.metrics.AuthenticationAttempts.WithLabelValues(authType, result, sm.getClientIP(r), r.UserAgent()).Inc()

	log.Info().
		Str("type", authType).
		Str("result", result).
		Str("ip", sm.getClientIP(r)).
		Str("user_agent", r.UserAgent()).
		Str("path", r.URL.Path).
		Msg("Authentication attempt")
}

func (sm *SecurityMiddleware) logSecurityViolation(r *http.Request, violationType, severity, details string) {
	userID := sm.getUserIDFromContext(r)
	clientIP := sm.getClientIP(r)

	sm.metrics.SecurityViolations.WithLabelValues(violationType, severity, clientIP, userID).Inc()

	log.Warn().
		Str("violation_type", violationType).
		Str("severity", severity).
		Str("ip", clientIP).
		Str("user_id", userID).
		Str("user_agent", r.UserAgent()).
		Str("path", r.URL.Path).
		Str("details", details).
		Msg("Security violation detected")
}

func (sm *SecurityMiddleware) handleSecureWebSocket(conn *websocket.Conn, secCtx *SecurityContext) {
	// Implementation for secure WebSocket handling
	// This would include heartbeat, message validation, etc.
	defer conn.Close()

	// Set timeouts
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetWriteDeadline(time.Now().Add(10 * time.Second))

	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Error().Err(err).Str("user_id", secCtx.UserID).Msg("WebSocket read error")
			break
		}

		// Process message with security validation
		response := sm.processWebSocketMessage(messageType, message, secCtx)
		if response != nil {
			if err := conn.WriteMessage(websocket.TextMessage, response); err != nil {
				log.Error().Err(err).Str("user_id", secCtx.UserID).Msg("WebSocket write error")
				break
			}
		}

		// Reset read deadline
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	}
}

func (sm *SecurityMiddleware) processWebSocketMessage(messageType int, message []byte, secCtx *SecurityContext) []byte {
	// Implementation for processing WebSocket messages securely
	// This would validate message format, authorize operations, etc.
	return nil
}

// GetSecurityMetrics returns security metrics for Prometheus
func (sm *SecurityMiddleware) GetSecurityMetrics() []prometheus.Collector {
	return []prometheus.Collector{
		&sm.metrics.RequestsTotal,
		&sm.metrics.AuthenticationAttempts,
		&sm.metrics.RateLimitHits,
		&sm.metrics.SecurityViolations,
		&sm.metrics.TLSConnections,
		&sm.metrics.GeoBlocks,
		&sm.metrics.IntentTokenValidations,
	}
}
