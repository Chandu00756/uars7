package attestation

import (
	"encoding/base64"
	"encoding/json"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// ContextClaim represents an attestation context claim
type ContextClaim struct {
	Issuer    string    `json:"iss"`
	Subject   string    `json:"sub"`
	Audience  string    `json:"aud"`
	ExpiresAt time.Time `json:"exp"`
	IssuedAt  time.Time `json:"iat"`
	NotBefore time.Time `json:"nbf"`
	Context   Context   `json:"context"`
}

// Context represents the attestation context
type Context struct {
	IPAddress   string            `json:"ip_address"`
	UserAgent   string            `json:"user_agent"`
	GeoLocation GeoLocation       `json:"geo_location"`
	DeviceInfo  DeviceInfo        `json:"device_info"`
	SecurityCtx SecurityContext   `json:"security_context"`
	Custom      map[string]string `json:"custom,omitempty"`
}

// GeoLocation represents geographical location data
type GeoLocation struct {
	Country   string  `json:"country"`
	Region    string  `json:"region"`
	City      string  `json:"city"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Timezone  string  `json:"timezone"`
}

// DeviceInfo represents device information
type DeviceInfo struct {
	Platform    string `json:"platform"`
	Browser     string `json:"browser"`
	Version     string `json:"version"`
	IsMobile    bool   `json:"is_mobile"`
	Fingerprint string `json:"fingerprint"`
}

// SecurityContext represents security-related context
type SecurityContext struct {
	TLSVersion     string   `json:"tls_version"`
	CipherSuite    string   `json:"cipher_suite"`
	TrustedHeaders []string `json:"trusted_headers"`
	RiskScore      float64  `json:"risk_score"`
}

// AttestationService provides context attestation capabilities
type AttestationService struct {
	jwtPublicKey string
}

// NewAttestationService creates a new attestation service
func NewAttestationService() *AttestationService {
	return &AttestationService{
		jwtPublicKey: os.Getenv("ADCF_JWT_PUBKEY"),
	}
}

// CreateContextClaim creates a new context attestation claim
func (s *AttestationService) CreateContextClaim(r *http.Request) *ContextClaim {
	now := time.Now()

	claim := &ContextClaim{
		Issuer:    "adcf-attestation",
		Subject:   "context-attestation",
		Audience:  "uars7-platform",
		ExpiresAt: now.Add(15 * time.Minute),
		IssuedAt:  now,
		NotBefore: now,
		Context:   s.extractContext(r),
	}

	return claim
}

// extractContext extracts attestation context from HTTP request
func (s *AttestationService) extractContext(r *http.Request) Context {
	ip := s.extractIPAddress(r)
	userAgent := r.UserAgent()

	return Context{
		IPAddress:   ip,
		UserAgent:   userAgent,
		GeoLocation: s.extractGeoLocation(ip),
		DeviceInfo:  s.extractDeviceInfo(userAgent),
		SecurityCtx: s.extractSecurityContext(r),
		Custom:      s.extractCustomHeaders(r),
	}
}

// extractIPAddress extracts the real IP address from request
func (s *AttestationService) extractIPAddress(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to remote address
	if ip, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return ip
	}

	return r.RemoteAddr
}

// extractGeoLocation extracts geographical location from IP
func (s *AttestationService) extractGeoLocation(ip string) GeoLocation {
	// TODO: Integrate with GeoIP service
	// For now, return mock data
	return GeoLocation{
		Country:   "Unknown",
		Region:    "Unknown",
		City:      "Unknown",
		Latitude:  0.0,
		Longitude: 0.0,
		Timezone:  "UTC",
	}
}

// extractDeviceInfo extracts device information from User-Agent
func (s *AttestationService) extractDeviceInfo(userAgent string) DeviceInfo {
	// Basic User-Agent parsing
	isMobile := strings.Contains(strings.ToLower(userAgent), "mobile")

	var platform, browser, version string

	// Simple platform detection
	switch {
	case strings.Contains(userAgent, "Windows"):
		platform = "Windows"
	case strings.Contains(userAgent, "Macintosh"):
		platform = "macOS"
	case strings.Contains(userAgent, "Linux"):
		platform = "Linux"
	case strings.Contains(userAgent, "Android"):
		platform = "Android"
	case strings.Contains(userAgent, "iPhone"):
		platform = "iOS"
	default:
		platform = "Unknown"
	}

	// Simple browser detection
	switch {
	case strings.Contains(userAgent, "Chrome"):
		browser = "Chrome"
	case strings.Contains(userAgent, "Firefox"):
		browser = "Firefox"
	case strings.Contains(userAgent, "Safari"):
		browser = "Safari"
	case strings.Contains(userAgent, "Edge"):
		browser = "Edge"
	default:
		browser = "Unknown"
	}

	// Generate device fingerprint (simplified)
	fingerprint := base64.StdEncoding.EncodeToString([]byte(userAgent))

	return DeviceInfo{
		Platform:    platform,
		Browser:     browser,
		Version:     version,
		IsMobile:    isMobile,
		Fingerprint: fingerprint,
	}
}

// extractSecurityContext extracts security-related context
func (s *AttestationService) extractSecurityContext(r *http.Request) SecurityContext {
	var tlsVersion, cipherSuite string

	if r.TLS != nil {
		tlsVersion = s.getTLSVersion(r.TLS.Version)
		cipherSuite = s.getCipherSuite(r.TLS.CipherSuite)
	}

	trustedHeaders := []string{
		"X-Forwarded-For",
		"X-Real-IP",
		"User-Agent",
		"Accept",
		"Accept-Language",
	}

	// Calculate basic risk score
	riskScore := s.calculateRiskScore(r)

	return SecurityContext{
		TLSVersion:     tlsVersion,
		CipherSuite:    cipherSuite,
		TrustedHeaders: trustedHeaders,
		RiskScore:      riskScore,
	}
}

// extractCustomHeaders extracts custom headers for attestation
func (s *AttestationService) extractCustomHeaders(r *http.Request) map[string]string {
	custom := make(map[string]string)

	// Extract specific headers that might be relevant for attestation
	relevantHeaders := []string{
		"X-Requested-With",
		"Origin",
		"Referer",
		"Accept-Encoding",
		"Accept-Language",
	}

	for _, header := range relevantHeaders {
		if value := r.Header.Get(header); value != "" {
			custom[strings.ToLower(header)] = value
		}
	}

	return custom
}

// getTLSVersion converts TLS version number to string
func (s *AttestationService) getTLSVersion(version uint16) string {
	switch version {
	case 0x0301:
		return "TLS 1.0"
	case 0x0302:
		return "TLS 1.1"
	case 0x0303:
		return "TLS 1.2"
	case 0x0304:
		return "TLS 1.3"
	default:
		return "Unknown"
	}
}

// getCipherSuite converts cipher suite number to string
func (s *AttestationService) getCipherSuite(suite uint16) string {
	// TODO: Implement comprehensive cipher suite mapping
	return "TLS_AES_256_GCM_SHA384" // Mock value
}

// calculateRiskScore calculates a basic risk score for the request
func (s *AttestationService) calculateRiskScore(r *http.Request) float64 {
	score := 0.0

	// Check for suspicious patterns
	userAgent := strings.ToLower(r.UserAgent())

	// Empty or generic user agents are suspicious
	if userAgent == "" || strings.Contains(userAgent, "bot") {
		score += 0.3
	}

	// Check for proxy headers
	if r.Header.Get("X-Forwarded-For") != "" {
		score += 0.1
	}

	// TLS version check
	if r.TLS != nil && r.TLS.Version < 0x0303 { // TLS < 1.2
		score += 0.2
	}

	// Normalize to 0-1 range
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// ValidateAttestation validates an attestation claim
func (s *AttestationService) ValidateAttestation(claim *ContextClaim) bool {
	// TODO: Implement proper Ed25519 signature verification with ADCF_JWT_PUBKEY

	// Basic validation
	now := time.Now()

	// Check expiration
	if now.After(claim.ExpiresAt) {
		log.Warn().Msg("Attestation claim expired")
		return false
	}

	// Check not before
	if now.Before(claim.NotBefore) {
		log.Warn().Msg("Attestation claim not yet valid")
		return false
	}

	// Validate issuer
	if claim.Issuer != "adcf-attestation" {
		log.Warn().Str("issuer", claim.Issuer).Msg("Invalid attestation issuer")
		return false
	}

	log.Debug().
		Str("subject", claim.Subject).
		Str("ip", claim.Context.IPAddress).
		Float64("risk_score", claim.Context.SecurityCtx.RiskScore).
		Msg("Validated attestation claim")

	return true
}

// SerializeAttestation serializes an attestation claim to JSON
func (s *AttestationService) SerializeAttestation(claim *ContextClaim) ([]byte, error) {
	return json.Marshal(claim)
}
