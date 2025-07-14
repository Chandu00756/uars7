package attestation

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// IntentToken represents a signed intent token
type IntentToken struct {
	Subject     string    `json:"sub"`
	Issuer      string    `json:"iss"`
	IssuedAt    time.Time `json:"iat"`
	ExpiresAt   time.Time `json:"exp"`
	Purpose     string    `json:"purpose"`
	CapsuleID   string    `json:"capsule_id,omitempty"`
	DeviceHash  string    `json:"device_hash"`
	GeoLocation string    `json:"geo"`
	Latitude    float64   `json:"lat,omitempty"`
	Longitude   float64   `json:"lon,omitempty"`
	IPAddress   string    `json:"ip"`
	UserAgent   string    `json:"user_agent"`
	Nonce       string    `json:"nonce"`
}

// Challenge represents an attestation challenge
type Challenge struct {
	ID        string    `json:"id"`
	Challenge string    `json:"challenge"`
	ExpiresAt time.Time `json:"expires_at"`
	ClientIP  string    `json:"client_ip"`
}

// Verifier handles intent token verification
type Verifier struct {
	publicKey       ed25519.PublicKey
	challenges      map[string]*Challenge
	challengesMutex sync.RWMutex
	ctx             context.Context
}

var (
	verifier     *Verifier
	verifierOnce sync.Once
)

// Initialize sets up the attestation verifier
func Initialize() error {
	var err error
	verifierOnce.Do(func() {
		pubKeyB64 := os.Getenv("INTENT_TOKEN_PUBKEY")
		if pubKeyB64 == "" {
			err = fmt.Errorf("INTENT_TOKEN_PUBKEY environment variable is required")
			return
		}

		publicKeyBytes, decodeErr := base64.StdEncoding.DecodeString(pubKeyB64)
		if decodeErr != nil {
			err = fmt.Errorf("failed to decode public key: %w", decodeErr)
			return
		}

		if len(publicKeyBytes) != ed25519.PublicKeySize {
			err = fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(publicKeyBytes))
			return
		}

		verifier = &Verifier{
			publicKey:  ed25519.PublicKey(publicKeyBytes),
			challenges: make(map[string]*Challenge),
		}
	})

	return err
}

// StartVerifier starts the attestation verifier background tasks
func StartVerifier(ctx context.Context) {
	if verifier == nil {
		return
	}

	verifier.ctx = ctx

	// Start challenge cleanup routine
	go verifier.cleanupExpiredChallenges()
}

// VerifyIntentTokenMiddleware is HTTP middleware for verifying intent tokens
func VerifyIntentTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip verification for health checks and public endpoints
		if isPublicEndpoint(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		token := r.Header.Get("X-Intent-Token")
		if token == "" {
			http.Error(w, "Missing intent token", http.StatusUnauthorized)
			return
		}

		valid, err := VerifyIntentToken(token, r)
		if err != nil || !valid {
			http.Error(w, "Invalid intent token", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// VerifyIntentToken verifies an intent token
func VerifyIntentToken(tokenStr string, r *http.Request) (bool, error) {
	if verifier == nil {
		return false, fmt.Errorf("verifier not initialized")
	}

	// Parse token (JWT-like format: header.payload.signature)
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return false, fmt.Errorf("invalid token format")
	}

	// Decode payload
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return false, fmt.Errorf("failed to decode payload: %w", err)
	}

	var token IntentToken
	if err := json.Unmarshal(payloadBytes, &token); err != nil {
		return false, fmt.Errorf("failed to unmarshal token: %w", err)
	}

	// Verify expiration
	if time.Now().After(token.ExpiresAt) {
		return false, fmt.Errorf("token expired")
	}

	// Verify issuer
	expectedIssuer := os.Getenv("INTENT_TOKEN_ISSUER")
	if expectedIssuer != "" && token.Issuer != expectedIssuer {
		return false, fmt.Errorf("invalid issuer")
	}

	// Verify signature
	message := parts[0] + "." + parts[1]
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}

	if !ed25519.Verify(verifier.publicKey, []byte(message), signature) {
		return false, fmt.Errorf("signature verification failed")
	}

	// Additional context verification
	if err := verifyTokenContext(&token, r); err != nil {
		return false, err
	}

	return true, nil
}

// verifyTokenContext verifies the context information in the token
func verifyTokenContext(token *IntentToken, r *http.Request) error {
	// Verify IP address matches
	clientIP := getClientIP(r)
	if token.IPAddress != clientIP {
		return fmt.Errorf("IP address mismatch")
	}

	// Verify geo-location constraints
	if err := verifyGeoLocation(token.GeoLocation, clientIP); err != nil {
		return err
	}

	// Verify device posture (simplified)
	if err := verifyDevicePosture(token.DeviceHash, r); err != nil {
		return err
	}

	return nil
}

// verifyGeoLocation verifies geographic constraints
func verifyGeoLocation(geoLocation, clientIP string) error {
	// Allowed countries/regions
	allowedGeo := map[string]bool{
		"US": true,
		"CA": true,
		"DE": true,
		"SG": true,
		// Add more as needed
	}

	if !allowedGeo[geoLocation] {
		return fmt.Errorf("geographic location not allowed: %s", geoLocation)
	}

	// In a real implementation, you would:
	// 1. Perform IP geolocation lookup
	// 2. Compare with claimed location
	// 3. Allow reasonable discrepancy for privacy

	return nil
}

// verifyDevicePosture verifies device security posture
func verifyDevicePosture(deviceHash string, r *http.Request) error {
	// In a real implementation, this would:
	// 1. Verify TPM attestation quotes
	// 2. Check device compliance status
	// 3. Validate secure boot state
	// 4. Verify anti-malware status

	if deviceHash == "" {
		return fmt.Errorf("device hash required")
	}

	// For now, just verify the hash format
	if len(deviceHash) != 64 { // SHA-256 hex
		return fmt.Errorf("invalid device hash format")
	}

	return nil
}

// GenerateChallenge generates a new attestation challenge
func (v *Verifier) GenerateChallenge(clientIP string) (*Challenge, error) {
	challengeBytes := make([]byte, 32)
	if _, err := rand.Read(challengeBytes); err != nil {
		return nil, fmt.Errorf("failed to generate challenge: %w", err)
	}

	challenge := &Challenge{
		ID:        fmt.Sprintf("challenge_%d", time.Now().UnixNano()),
		Challenge: base64.StdEncoding.EncodeToString(challengeBytes),
		ExpiresAt: time.Now().Add(5 * time.Minute),
		ClientIP:  clientIP,
	}

	v.challengesMutex.Lock()
	v.challenges[challenge.ID] = challenge
	v.challengesMutex.Unlock()

	return challenge, nil
}

// VerifyChallenge verifies a challenge response
func (v *Verifier) VerifyChallenge(challengeID, response string) error {
	v.challengesMutex.RLock()
	challenge, exists := v.challenges[challengeID]
	v.challengesMutex.RUnlock()

	if !exists {
		return fmt.Errorf("challenge not found")
	}

	if time.Now().After(challenge.ExpiresAt) {
		return fmt.Errorf("challenge expired")
	}

	// In a real implementation, this would verify:
	// 1. TPM attestation response
	// 2. Platform configuration registers (PCRs)
	// 3. Measured boot process
	// 4. Application integrity

	// For now, just verify response format
	if response == "" {
		return fmt.Errorf("empty response")
	}

	// Clean up used challenge
	v.challengesMutex.Lock()
	delete(v.challenges, challengeID)
	v.challengesMutex.Unlock()

	return nil
}

// cleanupExpiredChallenges removes expired challenges
func (v *Verifier) cleanupExpiredChallenges() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-v.ctx.Done():
			return
		case <-ticker.C:
			v.challengesMutex.Lock()
			now := time.Now()
			for id, challenge := range v.challenges {
				if now.After(challenge.ExpiresAt) {
					delete(v.challenges, id)
				}
			}
			v.challengesMutex.Unlock()
		}
	}
}

// GetAttestationRequirements returns the current attestation requirements
func GetAttestationRequirements() map[string]interface{} {
	return map[string]interface{}{
		"required_algorithms": []string{"Ed25519"},
		"token_max_age":       "5m",
		"geo_restrictions":    []string{"US", "CA", "DE", "SG"},
		"device_requirements": map[string]interface{}{
			"tpm_required":      true,
			"secure_boot":       true,
			"measured_boot":     true,
			"anti_malware":      true,
			"device_encryption": true,
		},
	}
}

// CreateIntentToken creates a new intent token (for testing/client use)
func CreateIntentToken(privateKey ed25519.PrivateKey, subject, purpose, capsuleID string) (string, error) {
	now := time.Now()

	token := IntentToken{
		Subject:     subject,
		Issuer:      os.Getenv("INTENT_TOKEN_ISSUER"),
		IssuedAt:    now,
		ExpiresAt:   now.Add(5 * time.Minute),
		Purpose:     purpose,
		CapsuleID:   capsuleID,
		DeviceHash:  generateMockDeviceHash(),
		GeoLocation: "US",
		IPAddress:   "127.0.0.1",
		UserAgent:   "ADCF-Client/1.0",
		Nonce:       fmt.Sprintf("%d", now.UnixNano()),
	}

	// Create header
	header := map[string]interface{}{
		"alg": "EdDSA",
		"typ": "JWT",
	}

	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	payloadBytes, err := json.Marshal(token)
	if err != nil {
		return "", err
	}

	headerB64 := base64.RawURLEncoding.EncodeToString(headerBytes)
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadBytes)

	message := headerB64 + "." + payloadB64
	signature := ed25519.Sign(privateKey, []byte(message))
	signatureB64 := base64.RawURLEncoding.EncodeToString(signature)

	return message + "." + signatureB64, nil
}

// Helper functions

func isPublicEndpoint(path string) bool {
	publicPaths := []string{
		"/healthz",
		"/readiness",
		"/metrics",
		"/api/v1/attestation/challenge",
	}

	for _, publicPath := range publicPaths {
		if strings.HasPrefix(path, publicPath) {
			return true
		}
	}

	return false
}

func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return ip
}

func generateMockDeviceHash() string {
	// In a real implementation, this would be generated by:
	// 1. TPM attestation quote
	// 2. Platform measurements
	// 3. Device configuration hash

	// For testing, generate a mock hash
	data := make([]byte, 32)
	rand.Read(data)
	return fmt.Sprintf("%x", data)
}

// Statistics and monitoring

// GetVerifierStats returns verifier statistics
func GetVerifierStats() map[string]interface{} {
	if verifier == nil {
		return map[string]interface{}{
			"initialized": false,
		}
	}

	verifier.challengesMutex.RLock()
	challengeCount := len(verifier.challenges)
	verifier.challengesMutex.RUnlock()

	return map[string]interface{}{
		"initialized":       true,
		"active_challenges": challengeCount,
		"public_key_loaded": len(verifier.publicKey) > 0,
	}
}
