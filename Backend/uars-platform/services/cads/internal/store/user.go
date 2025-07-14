package store

import (
	"net/http"
	"sync"

	"github.com/duo-labs/webauthn/webauthn"
	"github.com/gorilla/sessions"
)

// MemoryUserStore provides in-memory user storage for CADS
type MemoryUserStore struct {
	users map[string]*User
	mutex sync.RWMutex
}

// User represents a user in the CADS system
type User struct {
	ID          []byte                `json:"id"`
	Name        string                `json:"name"`
	DisplayName string                `json:"displayName"`
	Credentials []webauthn.Credential `json:"credentials"`
}

// WebAuthnID returns user ID for WebAuthn
func (u *User) WebAuthnID() []byte {
	return u.ID
}

// WebAuthnName returns username for WebAuthn
func (u *User) WebAuthnName() string {
	return u.Name
}

// WebAuthnDisplayName returns display name for WebAuthn
func (u *User) WebAuthnDisplayName() string {
	return u.DisplayName
}

// WebAuthnIcon returns user icon for WebAuthn (optional)
func (u *User) WebAuthnIcon() string {
	return ""
}

// WebAuthnCredentials returns user's credentials for WebAuthn
func (u *User) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// NewMemoryUserStore creates a new in-memory user store
func NewMemoryUserStore() *MemoryUserStore {
	return &MemoryUserStore{
		users: make(map[string]*User),
	}
}

// GetUser retrieves a user by name
func (s *MemoryUserStore) GetUser(name string) *User {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.users[name]
}

// SaveUser saves a user to the store
func (s *MemoryUserStore) SaveUser(user *User) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.users[user.Name] = user
}

// Session management
var (
	sessionStore = sessions.NewCookieStore([]byte("uars7-session-key-change-in-production"))
)

func init() {
	sessionStore.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   3600, // 1 hour
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
}

// GetSession returns the session for the request
func GetSession(w http.ResponseWriter, r *http.Request) (*sessions.Session, error) {
	return sessionStore.Get(r, "uars7-session")
}
