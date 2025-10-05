package auth

import (
	"bytes"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/portalvii/uars7/services/cads/internal/store"
)

/* ────────────────  WebAuthn Handler ──────────────────  */

type WebAuthnHandler struct {
	wa        *webauthn.WebAuthn
	userStore *store.MemoryUserStore
	security  *WebAuthnSecurity
}

// WebAuthnSecurity contains security configurations for WebAuthn
type WebAuthnSecurity struct {
	RequireResidentKey      bool
	RequireUserVerification bool
	Timeout                 time.Duration
	MaxCredentials          int
	AllowedOrigins          []string
}

func NewWebAuthnHandler(us *store.MemoryUserStore) *WebAuthnHandler {
	// Enhanced WebAuthn configuration for military-grade security
	wa, err := webauthn.New(&webauthn.Config{
		RPDisplayName: "UARS7 Platform",
		RPID:          "localhost",             // In production: your domain
		RPOrigin:      "http://localhost:5173", // In production: https://yourdomain.com
		RPIcon:        "",                      // Optional: your icon URL
		// Enhanced timeout for better security
		Timeout: 60000, // 60 seconds
	})
	if err != nil {
		log.Fatalf("WebAuthn init error: %v", err)
	}

	security := &WebAuthnSecurity{
		RequireResidentKey:      false, // Set to true for passwordless
		RequireUserVerification: true,  // Require biometric/PIN verification
		Timeout:                 60 * time.Second,
		MaxCredentials:          5, // Limit credentials per user
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:3000",
		},
	}

	return &WebAuthnHandler{
		wa:        wa,
		userStore: us,
		security:  security,
	}
}

/* ────────────────  Helper Functions ────────────────  */

// unwrapRaw handles both raw JSON objects and escaped string payloads
func unwrapRaw(raw json.RawMessage) ([]byte, error) {
	if len(raw) > 0 && raw[0] != '"' { // already a JSON object
		return raw, nil
	}
	var s string // quoted string → decode
	if err := json.Unmarshal(raw, &s); err != nil {
		return nil, err
	}
	return []byte(s), nil
}

/* ────────────────  Security Validation ────────────────  */

// validateOrigin performs enhanced origin validation
func (h *WebAuthnHandler) validateOrigin(r *http.Request) error {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return errors.New("missing origin header")
	}

	// Check against allowed origins using constant-time comparison
	for _, allowed := range h.security.AllowedOrigins {
		if subtle.ConstantTimeCompare([]byte(origin), []byte(allowed)) == 1 {
			return nil
		}
	}

	return errors.New("invalid origin")
}

// generateSecureChallenge creates a cryptographically secure challenge
func (h *WebAuthnHandler) generateSecureChallenge() ([]byte, error) {
	challenge := make([]byte, 32) // 256-bit challenge
	if _, err := rand.Read(challenge); err != nil {
		return nil, err
	}
	return challenge, nil
}

// validateUsername performs enhanced username validation
func (h *WebAuthnHandler) validateUsername(username string) error {
	if username == "" {
		return errors.New("username required")
	}

	if len(username) > 255 {
		return errors.New("username too long")
	}

	// Prevent path traversal and injection attacks
	if strings.Contains(username, "..") || strings.Contains(username, "/") ||
		strings.Contains(username, "\\") || strings.Contains(username, "<") ||
		strings.Contains(username, ">") || strings.Contains(username, "&") {
		return errors.New("invalid username format")
	}

	return nil
}

/* ────────────────  Registration ────────────────  */

func (h *WebAuthnHandler) BeginRegistration(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – BeginRegistration", r.Method, r.URL.Path)

	// Enhanced security validation
	if err := h.validateOrigin(r); err != nil {
		log.Printf("[SECURITY] Origin validation failed: %v", err)
		respondErr(w, r, http.StatusForbidden, "invalid origin")
		return
	}

	var req struct{ Username string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondErr(w, r, http.StatusBadRequest, "invalid request")
		return
	}

	// Enhanced username validation
	if err := h.validateUsername(req.Username); err != nil {
		log.Printf("[SECURITY] Username validation failed: %v", err)
		respondErr(w, r, http.StatusBadRequest, "invalid username")
		return
	}

	// Check if user already has maximum credentials
	existingUser := h.userStore.GetUser(req.Username)
	if existingUser != nil && len(existingUser.Credentials) >= h.security.MaxCredentials {
		respondErr(w, r, http.StatusBadRequest, "maximum credentials reached")
		return
	}

	// Create or get user
	u := existingUser
	if u == nil {
		u = &store.User{
			ID:          []byte(req.Username),
			Name:        req.Username,
			DisplayName: req.Username,
			Credentials: []webauthn.Credential{},
		}
		h.userStore.SaveUser(u)
	}

	// Create registration options with enhanced security
	opts, sd, err := h.wa.BeginRegistration(u)
	if err != nil {
		log.Printf("[ERROR] BeginRegistration failed: %v", err)
		respondErr(w, r, http.StatusInternalServerError, "begin-registration error: "+err.Error())
		return
	}

	// Apply enhanced security settings to the response
	if h.security.RequireUserVerification {
		opts.Response.AuthenticatorSelection.UserVerification = "required"
	}
	opts.Response.Timeout = int(h.security.Timeout.Milliseconds())

	if err = h.saveSession(w, r, "registration", sd); err != nil {
		return
	}

	respondJSON(w, r, opts.Response)
	log.Printf("[DONE] %s %s -> 200 (%v)", r.Method, r.URL.Path, time.Since(start))
}

func (h *WebAuthnHandler) FinishRegistration(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – FinishRegistration", r.Method, r.URL.Path)

	// Parse the body as a map to extract username and attestation
	var payload struct {
		Username    string          `json:"username"`
		Attestation json.RawMessage `json:"attestation"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondErr(w, r, http.StatusBadRequest, "invalid payload")
		return
	}
	if payload.Username == "" {
		respondErr(w, r, http.StatusBadRequest, "missing username")
		return
	}
	u := h.userStore.GetUser(payload.Username)
	if u == nil {
		respondErr(w, r, http.StatusNotFound, "user missing")
		return
	}

	sd, err := h.loadSession(w, r, "registration")
	if err != nil {
		return // loadSession already logged & wrote response
	}

	// Debug: log the attestation payload
	log.Printf("[DEBUG] Received attestation payload: %s", string(payload.Attestation))

	// Unwrap the raw attestation payload for consistency
	attestBytes, err := unwrapRaw(payload.Attestation)
	if err != nil {
		log.Printf("[ERROR] Failed to unwrap attestation: %v", err)
		respondErr(w, r, http.StatusBadRequest, "bad attestation format")
		return
	}

	// Replace r.Body with unwrapped attestation only
	r.Body = io.NopCloser(bytes.NewReader(attestBytes))

	cred, err := h.wa.FinishRegistration(u, *sd, r)
	if err != nil {
		respondErr(w, r, http.StatusBadRequest, err.Error())
		return
	}

	u.Credentials = append(u.Credentials, *cred)
	h.userStore.SaveUser(u)

	_, _ = w.Write([]byte("registered"))
	log.Printf("[DONE] %s %s -> 200 (%v)", r.Method, r.URL.Path, time.Since(start))
}

/* ────────────────  Login ───────────────────────  */

func (h *WebAuthnHandler) BeginLogin(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – BeginLogin", r.Method, r.URL.Path)

	var req struct{ Username string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" {
		respondErr(w, r, http.StatusBadRequest, "missing username")
		return
	}
	u := h.userStore.GetUser(req.Username)
	if u == nil {
		respondErr(w, r, http.StatusNotFound, "user missing")
		return
	}

	opts, sd, err := h.wa.BeginLogin(u)
	if err != nil {
		respondErr(w, r, http.StatusInternalServerError, "begin-login error: "+err.Error())
		return
	}

	if err = h.saveSession(w, r, "login", sd); err != nil {
		return
	}

	respondJSON(w, r, opts.Response)
	log.Printf("[DONE] %s %s -> 200 (%v)", r.Method, r.URL.Path, time.Since(start))
}

func (h *WebAuthnHandler) FinishLogin(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – FinishLogin", r.Method, r.URL.Path)

	// First, let's read the raw body to debug
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("[ERROR] Failed to read body: %v", err)
		respondErr(w, r, http.StatusBadRequest, "failed to read body")
		return
	}
	log.Printf("[DEBUG] Raw body received: %s", string(body))

	// Parse the body as a map to extract username and assertion
	var payload struct {
		Username  string          `json:"username"`
		Assertion json.RawMessage `json:"assertion"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[ERROR] Failed to parse payload: %v", err)
		respondErr(w, r, http.StatusBadRequest, "invalid payload")
		return
	}
	log.Printf("[DEBUG] Parsed username: %s", payload.Username)
	log.Printf("[DEBUG] Parsed assertion length: %d", len(payload.Assertion))

	if payload.Username == "" {
		respondErr(w, r, http.StatusBadRequest, "missing username")
		return
	}
	u := h.userStore.GetUser(payload.Username)
	if u == nil {
		respondErr(w, r, http.StatusNotFound, "user missing")
		return
	}

	sd, err := h.loadSession(w, r, "login")
	if err != nil {
		return
	}
	// Debug: log the assertion payload
	log.Printf("[DEBUG] Raw assertion payload: %s", string(payload.Assertion))

	// Unwrap the raw assertion payload - this is the key fix!
	assertBytes, err := unwrapRaw(payload.Assertion)
	if err != nil {
		log.Printf("[ERROR] Failed to unwrap assertion: %v", err)
		respondErr(w, r, http.StatusBadRequest, "bad assertion format")
		return
	}

	log.Printf("[DEBUG] Unwrapped assertion length: %d bytes", len(assertBytes))

	// Replace r.Body with unwrapped assertion only - this is what the WebAuthn library expects
	r.Body = io.NopCloser(bytes.NewReader(assertBytes))

	// Try to finish login with properly formatted assertion
	credential, err := h.wa.FinishLogin(u, *sd, r)
	if err != nil {
		log.Printf("[ERROR] FinishLogin failed: %v", err)
		respondErr(w, r, http.StatusUnauthorized, fmt.Sprintf("Login failed: %v", err))
		return
	}

	log.Printf("[SUCCESS] Login successful! Credential ID: %x", credential.ID)

	_, _ = w.Write([]byte("success"))
	log.Printf("[DONE] %s %s -> 200 (%v)", r.Method, r.URL.Path, time.Since(start))
}

/* ────────────────  Helpers ─────────────────────  */

func (h *WebAuthnHandler) saveSession(w http.ResponseWriter, r *http.Request, key string, sd *webauthn.SessionData) error {
	sess, err := store.GetSession(w, r)
	if err != nil {
		respondErr(w, r, http.StatusInternalServerError, "session error")
		return err
	}

	raw, _ := json.Marshal(sd)
	sess.Values[key] = raw
	return sess.Save(r, w)
}

func (h *WebAuthnHandler) loadSession(w http.ResponseWriter, r *http.Request, key string) (*webauthn.SessionData, error) {
	sess, err := store.GetSession(w, r)
	if err != nil {
		respondErr(w, r, http.StatusInternalServerError, "session error")
		return nil, err
	}

	v, ok := sess.Values[key].([]byte)
	if !ok {
		respondErr(w, r, http.StatusBadRequest, "no session")
		return nil, errors.New("missing session")
	}

	var sd webauthn.SessionData
	if err := json.Unmarshal(v, &sd); err != nil {
		respondErr(w, r, http.StatusBadRequest, "bad session")
		return nil, err
	}

	return &sd, nil
}

/* ────────────────  Responses ───────────────────  */

func respondJSON(w http.ResponseWriter, r *http.Request, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
	// Explicit 200 logging is done by caller; keep this lean
}

func respondErr(w http.ResponseWriter, r *http.Request, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": msg})
	log.Printf("[ERROR] %s %s -> %d %s", r.Method, r.URL.Path, code, msg)
}
