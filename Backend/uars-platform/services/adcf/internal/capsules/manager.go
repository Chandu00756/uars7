package capsules

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/portalvii/uars7/services/adcf/internal/crypto"
	"github.com/portalvii/uars7/services/adcf/internal/ledger"
	"github.com/rs/zerolog/log"
)

type Capsule struct {
	ID               string          `json:"id" db:"id"`
	OwnerID          string          `json:"owner_id" db:"owner_id"`
	DataHash         string          `json:"data_hash" db:"data_hash"`
	PolicyID         *string         `json:"policy_id" db:"policy_id"`
	EncryptedBlob    []byte          `json:"-" db:"encrypted_blob"`
	Metadata         json.RawMessage `json:"metadata" db:"metadata"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at" db:"updated_at"`
	ExpiresAt        *time.Time      `json:"expires_at" db:"expires_at"`
	Revoked          bool            `json:"revoked" db:"revoked"`
	SelfDestruct     bool            `json:"self_destruct" db:"self_destruct"`
	AccessCount      int             `json:"access_count" db:"access_count"`
	LockedUntil      *time.Time      `json:"locked_until" db:"locked_until"`
	SizeBytes        int64           `json:"size_bytes" db:"size_bytes"`
	Policy           *Policy         `json:"policy,omitempty"`
	LatestAuditEntry *AuditEntry     `json:"latest_audit,omitempty"`
}

type Policy struct {
	ID             string          `json:"id" db:"id"`
	Name           string          `json:"name" db:"name"`
	Description    string          `json:"description" db:"description"`
	PolicyDocument json.RawMessage `json:"policy_document" db:"policy_document"`
	SchemaVersion  int             `json:"schema_version" db:"schema_version"`
	CreatedAt      time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at" db:"updated_at"`
	CreatedBy      string          `json:"created_by" db:"created_by"`
	Active         bool            `json:"active" db:"active"`
}

type AuditEntry struct {
	ID                string          `json:"id" db:"id"`
	CapsuleID         *string         `json:"capsule_id" db:"capsule_id"`
	PolicyID          *string         `json:"policy_id" db:"policy_id"`
	Action            string          `json:"action" db:"action"`
	ActorID           string          `json:"actor_id" db:"actor_id"`
	Timestamp         time.Time       `json:"timestamp" db:"timestamp"`
	Details           json.RawMessage `json:"details" db:"details"`
	IPAddress         *string         `json:"ip_address" db:"ip_address"`
	UserAgent         *string         `json:"user_agent" db:"user_agent"`
	GeoLocation       *string         `json:"geo_location" db:"geo_location"`
	DeviceFingerprint *string         `json:"device_fingerprint" db:"device_fingerprint"`
	IntentTokenHash   *string         `json:"intent_token_hash" db:"intent_token_hash"`
	Success           bool            `json:"success" db:"success"`
	ErrorMessage      *string         `json:"error_message" db:"error_message"`
}

type MintRequest struct {
	Data         []byte          `json:"data"`
	PolicyID     *string         `json:"policy_id"`
	Metadata     json.RawMessage `json:"metadata"`
	ExpiresAt    *time.Time      `json:"expires_at"`
	SelfDestruct bool            `json:"self_destruct"`
}

type AccessRequest struct {
	CapsuleID   string `json:"capsule_id"`
	IntentToken string `json:"intent_token"`
	Purpose     string `json:"purpose"`
	UserAgent   string `json:"user_agent"`
	IPAddress   string `json:"ip_address"`
}

type Manager struct {
	db    *sql.DB
	ctx   context.Context
	mutex sync.RWMutex
}

var manager *Manager

// StartManager initializes and starts the capsule manager
func StartManager(ctx context.Context, db *sql.DB) {
	manager = &Manager{
		db:  db,
		ctx: ctx,
	}

	log.Info().Msg("Capsule manager started successfully")

	// Start background cleanup tasks
	go manager.startCleanupTasks()
}

// NewManager creates a new capsule manager
func NewManager(db *sql.DB) *Manager {
	return &Manager{db: db}
}

// startCleanupTasks runs periodic cleanup operations
func (m *Manager) startCleanupTasks() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			m.cleanupExpiredCapsules()
			m.cleanupOldAuditLogs()
		}
	}
}

// cleanupExpiredCapsules removes expired capsules
func (m *Manager) cleanupExpiredCapsules() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	query := `
		UPDATE capsules 
		SET revoked = true, updated_at = NOW()
		WHERE expires_at IS NOT NULL 
		AND expires_at < NOW() 
		AND revoked = false
	`

	result, err := m.db.Exec(query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to cleanup expired capsules")
		return
	}

	count, _ := result.RowsAffected()
	if count > 0 {
		log.Info().Int64("count", count).Msg("Cleaned up expired capsules")
	}
}

// cleanupOldAuditLogs removes audit logs older than retention period
func (m *Manager) cleanupOldAuditLogs() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Keep audit logs for 1 year
	query := `
		DELETE FROM audit_logs 
		WHERE timestamp < NOW() - INTERVAL '1 year'
	`

	result, err := m.db.Exec(query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to cleanup old audit logs")
		return
	}

	count, _ := result.RowsAffected()
	if count > 0 {
		log.Info().Int64("count", count).Msg("Cleaned up old audit logs")
	}
}

// Mint creates a new data capsule
func Mint(db *sql.DB, req MintRequest, ownerID string) (string, error) {
	if len(req.Data) == 0 {
		return "", fmt.Errorf("data cannot be empty")
	}

	// Generate unique ID
	id := crypto.GenerateID()
	if id == "" {
		return "", fmt.Errorf("failed to generate capsule ID")
	}

	// Encrypt the data
	encryptedData, err := crypto.Encrypt(req.Data)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt data: %w", err)
	}

	// Calculate data hash for integrity
	dataHash := crypto.HashHex(req.Data)

	// Set default metadata if none provided
	metadata := req.Metadata
	if metadata == nil {
		metadata = json.RawMessage("{}")
	}

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert capsule
	query := `
		INSERT INTO capsules (
			id, owner_id, data_hash, policy_id, encrypted_blob, 
			metadata, expires_at, self_destruct, size_bytes, 
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
		)
	`

	_, err = tx.Exec(query, id, ownerID, dataHash, req.PolicyID,
		encryptedData, metadata, req.ExpiresAt, req.SelfDestruct,
		len(encryptedData))
	if err != nil {
		return "", fmt.Errorf("failed to insert capsule: %w", err)
	}

	// Log audit entry
	auditDetails := map[string]interface{}{
		"data_size":      len(req.Data),
		"encrypted_size": len(encryptedData),
		"self_destruct":  req.SelfDestruct,
	}
	if req.ExpiresAt != nil {
		auditDetails["expires_at"] = req.ExpiresAt.Format(time.RFC3339)
	}

	if err := logAuditEntry(tx, id, req.PolicyID, "MINT", ownerID, auditDetails, true, nil); err != nil {
		return "", fmt.Errorf("failed to log audit entry: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Log to ledger
	ledger.Log(ledger.Entry{
		CapsuleID: id,
		Action:    "MINT",
		ActorID:   ownerID,
		Hash:      dataHash,
	})

	log.Info().
		Str("capsule_id", id).
		Str("owner_id", ownerID).
		Int("data_size", len(req.Data)).
		Msg("Capsule minted successfully")

	return id, nil
}

// GetByID retrieves a capsule by its ID
func GetByID(db *sql.DB, id string) (*Capsule, error) {
	query := `
		SELECT c.id, c.owner_id, c.data_hash, c.policy_id, c.encrypted_blob,
		       c.metadata, c.created_at, c.updated_at, c.expires_at,
		       c.revoked, c.self_destruct, c.access_count, c.locked_until,
		       c.size_bytes
		FROM capsules c
		WHERE c.id = $1
	`

	var capsule Capsule
	err := db.QueryRow(query, id).Scan(
		&capsule.ID, &capsule.OwnerID, &capsule.DataHash, &capsule.PolicyID,
		&capsule.EncryptedBlob, &capsule.Metadata, &capsule.CreatedAt,
		&capsule.UpdatedAt, &capsule.ExpiresAt, &capsule.Revoked,
		&capsule.SelfDestruct, &capsule.AccessCount, &capsule.LockedUntil,
		&capsule.SizeBytes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("capsule not found")
		}
		return nil, fmt.Errorf("failed to query capsule: %w", err)
	}

	// Load policy if specified
	if capsule.PolicyID != nil {
		policy, err := GetPolicyByID(db, *capsule.PolicyID)
		if err != nil {
			log.Warn().Err(err).Str("policy_id", *capsule.PolicyID).Msg("Failed to load policy")
		} else {
			capsule.Policy = policy
		}
	}

	// Load latest audit entry
	auditEntry, err := getLatestAuditEntry(db, id)
	if err != nil {
		log.Warn().Err(err).Str("capsule_id", id).Msg("Failed to load latest audit entry")
	} else {
		capsule.LatestAuditEntry = auditEntry
	}

	return &capsule, nil
}

// List retrieves capsules for a specific owner
func List(db *sql.DB, ownerID string) ([]*Capsule, error) {
	query := `
		SELECT c.id, c.owner_id, c.data_hash, c.policy_id, 
		       c.metadata, c.created_at, c.updated_at, c.expires_at,
		       c.revoked, c.self_destruct, c.access_count, c.locked_until,
		       c.size_bytes
		FROM capsules c
		WHERE c.owner_id = $1
		ORDER BY c.created_at DESC
		LIMIT 100
	`

	rows, err := db.Query(query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to query capsules: %w", err)
	}
	defer rows.Close()

	var capsules []*Capsule

	for rows.Next() {
		var capsule Capsule
		err := rows.Scan(
			&capsule.ID, &capsule.OwnerID, &capsule.DataHash, &capsule.PolicyID,
			&capsule.Metadata, &capsule.CreatedAt, &capsule.UpdatedAt,
			&capsule.ExpiresAt, &capsule.Revoked, &capsule.SelfDestruct,
			&capsule.AccessCount, &capsule.LockedUntil, &capsule.SizeBytes,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan capsule: %w", err)
		}

		// Don't include encrypted blob in list view for performance
		capsule.EncryptedBlob = nil

		capsules = append(capsules, &capsule)
	}

	return capsules, nil
}

// Access retrieves and decrypts capsule data
func Access(db *sql.DB, capsuleID, intentToken string, ctx context.Context) ([]byte, error) {
	// Get capsule
	capsule, err := GetByID(db, capsuleID)
	if err != nil {
		return nil, err
	}

	// Check if capsule is revoked
	if capsule.Revoked {
		return nil, fmt.Errorf("capsule is revoked")
	}

	// Check if capsule is locked
	if capsule.LockedUntil != nil && time.Now().Before(*capsule.LockedUntil) {
		return nil, fmt.Errorf("capsule is temporarily locked")
	}

	// Check if capsule is expired
	if capsule.ExpiresAt != nil && time.Now().After(*capsule.ExpiresAt) {
		return nil, fmt.Errorf("capsule has expired")
	}

	// TODO: Verify intent token and policy
	// This would integrate with the policy engine and attestation verifier

	// Decrypt data
	decryptedData, err := crypto.Decrypt(capsule.EncryptedBlob)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt data: %w", err)
	}

	// Verify data integrity
	dataHash := crypto.HashHex(decryptedData)
	if dataHash != capsule.DataHash {
		return nil, fmt.Errorf("data integrity check failed")
	}

	// Update access count
	_, err = db.Exec(`
		UPDATE capsules 
		SET access_count = access_count + 1, updated_at = NOW()
		WHERE id = $1
	`, capsuleID)
	if err != nil {
		log.Error().Err(err).Str("capsule_id", capsuleID).Msg("Failed to update access count")
	}

	// Log audit entry
	auditDetails := map[string]interface{}{
		"intent_token_hash": crypto.HashHex([]byte(intentToken)),
		"data_size":         len(decryptedData),
	}

	tx, err := db.Begin()
	if err == nil {
		logAuditEntry(tx, capsuleID, capsule.PolicyID, "ACCESS", "user", auditDetails, true, nil)
		tx.Commit()
	}

	// Log to ledger
	ledger.Log(ledger.Entry{
		CapsuleID: capsuleID,
		Action:    "ACCESS",
		ActorID:   "user",
		Hash:      dataHash,
	})

	// Handle self-destruct
	if capsule.SelfDestruct && capsule.AccessCount >= 0 {
		go func() {
			time.Sleep(1 * time.Second) // Small delay to ensure response is sent
			Revoke(db, capsuleID, "system")
		}()
	}

	log.Info().
		Str("capsule_id", capsuleID).
		Int("data_size", len(decryptedData)).
		Msg("Capsule accessed successfully")

	return decryptedData, nil
}

// Revoke marks a capsule as revoked
func Revoke(db *sql.DB, capsuleID, actorID string) error {
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Update capsule
	result, err := tx.Exec(`
		UPDATE capsules 
		SET revoked = true, updated_at = NOW()
		WHERE id = $1 AND revoked = false
	`, capsuleID)
	if err != nil {
		return fmt.Errorf("failed to revoke capsule: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("capsule not found or already revoked")
	}

	// Log audit entry
	auditDetails := map[string]interface{}{
		"reason": "explicit_revocation",
	}

	if err := logAuditEntry(tx, capsuleID, nil, "REVOKE", actorID, auditDetails, true, nil); err != nil {
		return fmt.Errorf("failed to log audit entry: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Log to ledger
	ledger.Log(ledger.Entry{
		CapsuleID: capsuleID,
		Action:    "REVOKE",
		ActorID:   actorID,
		Hash:      "",
	})

	log.Info().
		Str("capsule_id", capsuleID).
		Str("actor_id", actorID).
		Msg("Capsule revoked successfully")

	return nil
}

// GetPolicyByID retrieves a policy by its ID
func GetPolicyByID(db *sql.DB, id string) (*Policy, error) {
	query := `
		SELECT id, name, description, policy_document, schema_version,
		       created_at, updated_at, created_by, active
		FROM policies
		WHERE id = $1 AND active = true
	`

	var policy Policy
	err := db.QueryRow(query, id).Scan(
		&policy.ID, &policy.Name, &policy.Description, &policy.PolicyDocument,
		&policy.SchemaVersion, &policy.CreatedAt, &policy.UpdatedAt,
		&policy.CreatedBy, &policy.Active,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("policy not found")
		}
		return nil, fmt.Errorf("failed to query policy: %w", err)
	}

	return &policy, nil
}

// getLatestAuditEntry retrieves the most recent audit entry for a capsule
func getLatestAuditEntry(db *sql.DB, capsuleID string) (*AuditEntry, error) {
	query := `
		SELECT id, capsule_id, policy_id, action, actor_id, timestamp,
		       details, ip_address, user_agent, geo_location,
		       device_fingerprint, intent_token_hash, success, error_message
		FROM audit_logs
		WHERE capsule_id = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var entry AuditEntry
	err := db.QueryRow(query, capsuleID).Scan(
		&entry.ID, &entry.CapsuleID, &entry.PolicyID, &entry.Action,
		&entry.ActorID, &entry.Timestamp, &entry.Details, &entry.IPAddress,
		&entry.UserAgent, &entry.GeoLocation, &entry.DeviceFingerprint,
		&entry.IntentTokenHash, &entry.Success, &entry.ErrorMessage,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No audit entries found
		}
		return nil, fmt.Errorf("failed to query audit entry: %w", err)
	}

	return &entry, nil
}

// logAuditEntry creates an audit log entry
func logAuditEntry(tx *sql.Tx, capsuleID string, policyID *string, action, actorID string,
	details map[string]interface{}, success bool, errorMessage *string) error {

	detailsJSON, err := json.Marshal(details)
	if err != nil {
		return fmt.Errorf("failed to marshal audit details: %w", err)
	}

	query := `
		INSERT INTO audit_logs (
			capsule_id, policy_id, action, actor_id, details, 
			success, error_message, timestamp
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW()
		)
	`

	_, err = tx.Exec(query, capsuleID, policyID, action, actorID,
		detailsJSON, success, errorMessage)
	if err != nil {
		return fmt.Errorf("failed to insert audit entry: %w", err)
	}

	return nil
}

// AccessCapsule provides access to a capsule
func (m *Manager) AccessCapsule(capsuleID, userID string) ([]byte, error) {
	// TODO: Implement proper capsule access logic
	return []byte("placeholder data"), nil
}

// RevokeCapsule revokes access to a capsule
func (m *Manager) RevokeCapsule(capsuleID, userID string) error {
	// TODO: Implement proper capsule revocation logic
	return nil
}

// CreatePolicy creates a new policy
func CreatePolicy(db *sql.DB, policy *Policy) (string, error) {
	// TODO: Implement proper policy creation logic
	return "placeholder-policy-id", nil
}
