package capsules

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

// Store provides database storage operations for capsules
type Store struct {
	db *sql.DB
}

// NewStore creates a new capsule store
func NewStore(db *sql.DB) *Store {
	return &Store{
		db: db,
	}
}

// Create stores a new capsule in the database
func (s *Store) Create(ctx context.Context, capsule *Capsule) error {
	if err := ValidateCapsuleFields(capsule); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	query := `
		INSERT INTO capsules (
			id, owner_id, data_hash, policy_id, encrypted_blob,
			metadata, created_at, updated_at, expires_at,
			revoked, self_destruct, access_count, locked_until, size_bytes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`

	var expiresAt interface{}
	if capsule.ExpiresAt != nil {
		expiresAt = *capsule.ExpiresAt
	}

	var lockedUntil interface{}
	if capsule.LockedUntil != nil {
		lockedUntil = *capsule.LockedUntil
	}

	var metadata interface{}
	if capsule.Metadata != nil {
		metadata = string(capsule.Metadata)
	}

	_, err := s.db.ExecContext(ctx, query,
		capsule.ID,
		capsule.OwnerID,
		capsule.DataHash,
		capsule.PolicyID,
		capsule.EncryptedBlob,
		metadata,
		capsule.CreatedAt,
		capsule.UpdatedAt,
		expiresAt,
		capsule.Revoked,
		capsule.SelfDestruct,
		capsule.AccessCount,
		lockedUntil,
		capsule.SizeBytes,
	)

	if err != nil {
		log.Error().Err(err).Str("capsule_id", capsule.ID).Msg("Failed to create capsule")
		return fmt.Errorf("failed to create capsule: %w", err)
	}

	log.Info().Str("capsule_id", capsule.ID).Msg("Capsule created successfully")
	return nil
}

// GetByID retrieves a capsule by its ID
func (s *Store) GetByID(ctx context.Context, id string) (*Capsule, error) {
	query := `
		SELECT id, owner_id, data_hash, policy_id, encrypted_blob,
		       metadata, created_at, updated_at, expires_at,
		       revoked, self_destruct, access_count, locked_until, size_bytes
		FROM capsules
		WHERE id = $1
	`

	row := s.db.QueryRowContext(ctx, query, id)

	var c Capsule
	var expiresAt sql.NullTime
	var lockedUntil sql.NullTime
	var metadata sql.NullString

	err := row.Scan(
		&c.ID,
		&c.OwnerID,
		&c.DataHash,
		&c.PolicyID,
		&c.EncryptedBlob,
		&metadata,
		&c.CreatedAt,
		&c.UpdatedAt,
		&expiresAt,
		&c.Revoked,
		&c.SelfDestruct,
		&c.AccessCount,
		&lockedUntil,
		&c.SizeBytes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("capsule not found: %s", id)
		}
		log.Error().Err(err).Str("capsule_id", id).Msg("Failed to get capsule")
		return nil, fmt.Errorf("failed to get capsule: %w", err)
	}

	if expiresAt.Valid {
		c.ExpiresAt = &expiresAt.Time
	}

	if lockedUntil.Valid {
		c.LockedUntil = &lockedUntil.Time
	}

	if metadata.Valid && metadata.String != "" {
		c.Metadata = []byte(metadata.String)
	}

	return &c, nil
}

// GetByOwner retrieves capsules for a specific owner
func (s *Store) GetByOwner(ctx context.Context, ownerID string, limit, offset int) ([]*Capsule, error) {
	query := `
		SELECT id, owner_id, data_hash, policy_id, encrypted_blob,
		       metadata, created_at, updated_at, expires_at,
		       revoked, self_destruct, access_count, locked_until, size_bytes
		FROM capsules
		WHERE owner_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, query, ownerID, limit, offset)
	if err != nil {
		log.Error().Err(err).Str("owner_id", ownerID).Msg("Failed to get capsules by owner")
		return nil, fmt.Errorf("failed to get capsules by owner: %w", err)
	}
	defer rows.Close()

	var capsules []*Capsule
	for rows.Next() {
		capsule, err := s.scanCapsule(rows)
		if err != nil {
			return nil, err
		}
		capsules = append(capsules, capsule)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating capsules: %w", err)
	}

	return capsules, nil
}

// Update modifies an existing capsule
func (s *Store) Update(ctx context.Context, capsule *Capsule) error {
	query := `
		UPDATE capsules
		SET owner_id = $2, data_hash = $3, policy_id = $4, encrypted_blob = $5,
		    metadata = $6, updated_at = $7, expires_at = $8,
		    revoked = $9, self_destruct = $10, access_count = $11,
		    locked_until = $12, size_bytes = $13
		WHERE id = $1
	`

	var expiresAt interface{}
	if capsule.ExpiresAt != nil {
		expiresAt = *capsule.ExpiresAt
	}

	var lockedUntil interface{}
	if capsule.LockedUntil != nil {
		lockedUntil = *capsule.LockedUntil
	}

	var metadata interface{}
	if capsule.Metadata != nil {
		metadata = string(capsule.Metadata)
	}

	result, err := s.db.ExecContext(ctx, query,
		capsule.ID,
		capsule.OwnerID,
		capsule.DataHash,
		capsule.PolicyID,
		capsule.EncryptedBlob,
		metadata,
		time.Now(),
		expiresAt,
		capsule.Revoked,
		capsule.SelfDestruct,
		capsule.AccessCount,
		lockedUntil,
		capsule.SizeBytes,
	)

	if err != nil {
		log.Error().Err(err).Str("capsule_id", capsule.ID).Msg("Failed to update capsule")
		return fmt.Errorf("failed to update capsule: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("capsule not found: %s", capsule.ID)
	}

	log.Info().Str("capsule_id", capsule.ID).Msg("Capsule updated successfully")
	return nil
}

// Delete removes a capsule from the database
func (s *Store) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM capsules WHERE id = $1`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		log.Error().Err(err).Str("capsule_id", id).Msg("Failed to delete capsule")
		return fmt.Errorf("failed to delete capsule: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("capsule not found: %s", id)
	}

	log.Info().Str("capsule_id", id).Msg("Capsule deleted successfully")
	return nil
}

// MarkRevoked marks a capsule as revoked
func (s *Store) MarkRevoked(ctx context.Context, id string) error {
	query := `
		UPDATE capsules
		SET revoked = true, updated_at = NOW()
		WHERE id = $1 AND revoked = false
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		log.Error().Err(err).Str("capsule_id", id).Msg("Failed to revoke capsule")
		return fmt.Errorf("failed to revoke capsule: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("capsule not found or already revoked: %s", id)
	}

	log.Info().Str("capsule_id", id).Msg("Capsule revoked successfully")
	return nil
}

// IncrementAccessCount increments the access count for a capsule
func (s *Store) IncrementAccessCount(ctx context.Context, id string) error {
	query := `
		UPDATE capsules
		SET access_count = access_count + 1, updated_at = NOW()
		WHERE id = $1
	`

	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		log.Error().Err(err).Str("capsule_id", id).Msg("Failed to increment access count")
		return fmt.Errorf("failed to increment access count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("capsule not found: %s", id)
	}

	return nil
}

// GetExpiredCapsules retrieves capsules that have expired
func (s *Store) GetExpiredCapsules(ctx context.Context, limit int) ([]*Capsule, error) {
	query := `
		SELECT id, owner_id, data_hash, policy_id, encrypted_blob,
		       metadata, created_at, updated_at, expires_at,
		       revoked, self_destruct, access_count, locked_until, size_bytes
		FROM capsules
		WHERE expires_at < NOW() AND revoked = false
		ORDER BY expires_at ASC
		LIMIT $1
	`

	rows, err := s.db.QueryContext(ctx, query, limit)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get expired capsules")
		return nil, fmt.Errorf("failed to get expired capsules: %w", err)
	}
	defer rows.Close()

	var capsules []*Capsule
	for rows.Next() {
		capsule, err := s.scanCapsule(rows)
		if err != nil {
			return nil, err
		}
		capsules = append(capsules, capsule)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating expired capsules: %w", err)
	}

	return capsules, nil
}

// GetStats retrieves statistics about capsules
func (s *Store) GetStats(ctx context.Context, ownerID string) (*CapsuleStats, error) {
	query := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN revoked = false AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 END) as active,
			COUNT(CASE WHEN revoked = true THEN 1 END) as revoked,
			COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 1 END) as expired,
			COALESCE(SUM(access_count), 0) as total_accesses,
			COALESCE(SUM(size_bytes), 0) as total_size
		FROM capsules
	`

	args := []interface{}{}
	if ownerID != "" {
		query += " WHERE owner_id = $1"
		args = append(args, ownerID)
	}

	row := s.db.QueryRowContext(ctx, query, args...)

	var stats CapsuleStats
	err := row.Scan(
		&stats.Total,
		&stats.Active,
		&stats.Revoked,
		&stats.Expired,
		&stats.TotalAccesses,
		&stats.TotalSize,
	)

	if err != nil {
		log.Error().Err(err).Msg("Failed to get capsule stats")
		return nil, fmt.Errorf("failed to get capsule stats: %w", err)
	}

	return &stats, nil
}

// scanCapsule scans a database row into a Capsule struct
func (s *Store) scanCapsule(rows *sql.Rows) (*Capsule, error) {
	var c Capsule
	var expiresAt sql.NullTime
	var lockedUntil sql.NullTime
	var metadata sql.NullString

	err := rows.Scan(
		&c.ID,
		&c.OwnerID,
		&c.DataHash,
		&c.PolicyID,
		&c.EncryptedBlob,
		&metadata,
		&c.CreatedAt,
		&c.UpdatedAt,
		&expiresAt,
		&c.Revoked,
		&c.SelfDestruct,
		&c.AccessCount,
		&lockedUntil,
		&c.SizeBytes,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to scan capsule row: %w", err)
	}

	if expiresAt.Valid {
		c.ExpiresAt = &expiresAt.Time
	}

	if lockedUntil.Valid {
		c.LockedUntil = &lockedUntil.Time
	}

	if metadata.Valid && metadata.String != "" {
		c.Metadata = []byte(metadata.String)
	}

	return &c, nil
}

// CapsuleStats represents capsule statistics
type CapsuleStats struct {
	Total         int   `json:"total"`
	Active        int   `json:"active"`
	Revoked       int   `json:"revoked"`
	Expired       int   `json:"expired"`
	TotalAccesses int64 `json:"total_accesses"`
	TotalSize     int64 `json:"total_size"`
}
