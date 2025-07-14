package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/portalvii/uars7/services/cads/internal/store"
)

/* ────────────────  WebAuthn Handler ──────────────────  */

type WebAuthnHandler struct {
	wa        *webauthn.WebAuthn
	userStore *store.MemoryUserStore
}

func NewWebAuthnHandler(us *store.MemoryUserStore) *WebAuthnHandler {
	wa, err := webauthn.New(&webauthn.Config{
		RPDisplayName: "UARS7",
		RPID:          "localhost",
		RPOrigin:      "http://localhost:5173",
	})
	if err != nil {
		log.Fatalf("WebAuthn init error: %v", err)
	}
	return &WebAuthnHandler{wa: wa, userStore: us}
}

/* ────────────────  Registration ────────────────  */

func (h *WebAuthnHandler) BeginRegistration(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – BeginRegistration", r.Method, r.URL.Path)

	u := &store.User{ID: []byte("admin"), Name: "admin", DisplayName: "Admin"}
	h.userStore.SaveUser(u)

	opts, sd, err := h.wa.BeginRegistration(u)
	if err != nil {
		respondErr(w, r, http.StatusInternalServerError, "begin-reg error: "+err.Error())
		return
	}

	if err = h.saveSession(w, r, "registration", sd); err != nil {
		return
	}

	respondJSON(w, r, opts.Response)
	log.Printf("[DONE] %s %s -> 200 (%v)", r.Method, r.URL.Path, time.Since(start))
}

func (h *WebAuthnHandler) FinishRegistration(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	log.Printf("[CALL] %s %s – FinishRegistration", r.Method, r.URL.Path)

	u := h.userStore.GetUser("admin")
	if u == nil {
		respondErr(w, r, http.StatusNotFound, "user missing")
		return
	}

	sd, err := h.loadSession(w, r, "registration")
	if err != nil {
		return // loadSession already logged & wrote response
	}

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

	u := h.userStore.GetUser("admin")
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

	u := h.userStore.GetUser("admin")
	if u == nil {
		respondErr(w, r, http.StatusNotFound, "user missing")
		return
	}

	sd, err := h.loadSession(w, r, "login")
	if err != nil {
		return
	}

	if _, err = h.wa.FinishLogin(u, *sd, r); err != nil {
		respondErr(w, r, http.StatusUnauthorized, err.Error())
		return
	}

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
