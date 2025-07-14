package capsules

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

// SQLHelpers provides database helper functions for capsule operations

// CapsuleRowScanner defines interface for scanning capsule rows
type CapsuleRowScanner interface {
	Scan(dest ...interface{}) error
}

// ScanCapsule scans a database row into a Capsule struct
func ScanCapsule(scanner CapsuleRowScanner) (*Capsule, error) {
	var c Capsule
	var createdAt, updatedAt time.Time
	var expiresAt sql.NullTime
	var metadataJSON sql.NullString
	var lockedUntil sql.NullTime

	err := scanner.Scan(
		&c.ID,
		&c.OwnerID,
		&c.DataHash,
		&c.PolicyID,
		&createdAt,
		&updatedAt,
		&expiresAt,
		&c.Revoked,
		&c.SelfDestruct,
		&c.AccessCount,
		&lockedUntil,
		&c.SizeBytes,
		&metadataJSON,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to scan capsule: %w", err)
	}

	c.CreatedAt = createdAt
	c.UpdatedAt = updatedAt

	if expiresAt.Valid {
		c.ExpiresAt = &expiresAt.Time
	}

	if lockedUntil.Valid {
		c.LockedUntil = &lockedUntil.Time
	}

	if metadataJSON.Valid && metadataJSON.String != "" {
		c.Metadata = json.RawMessage(metadataJSON.String)
	}

	return &c, nil
}

// CapsuleQuery represents a query for capsules with filters
type CapsuleQuery struct {
	UserID   string
	Status   string
	PolicyID string
	Limit    int
	Offset   int
	SortBy   string
	SortDesc bool
}

// BuildCapsuleQuery constructs SQL query with filters
func (cq *CapsuleQuery) BuildCapsuleQuery() (string, []interface{}) {
	query := `
		SELECT id, data_hash, policy_id, created_at, updated_at, 
		       created_by, access_count, last_accessed, status, 
		       expiry_date, metadata
		FROM capsules
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if cq.UserID != "" {
		query += fmt.Sprintf(" AND created_by = $%d", argIndex)
		args = append(args, cq.UserID)
		argIndex++
	}

	if cq.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, cq.Status)
		argIndex++
	}

	if cq.PolicyID != "" {
		query += fmt.Sprintf(" AND policy_id = $%d", argIndex)
		args = append(args, cq.PolicyID)
		argIndex++
	}

	// Add sorting
	if cq.SortBy != "" {
		direction := "ASC"
		if cq.SortDesc {
			direction = "DESC"
		}
		query += fmt.Sprintf(" ORDER BY %s %s", cq.SortBy, direction)
	} else {
		query += " ORDER BY created_at DESC"
	}

	// Add pagination
	if cq.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, cq.Limit)
		argIndex++
	}

	if cq.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, cq.Offset)
		argIndex++
	}

	return query, args
}

// CountCapsuleQuery builds a count query
func (cq *CapsuleQuery) BuildCountQuery() (string, []interface{}) {
	query := `SELECT COUNT(*) FROM capsules WHERE 1=1`
	args := []interface{}{}
	argIndex := 1

	if cq.UserID != "" {
		query += fmt.Sprintf(" AND created_by = $%d", argIndex)
		args = append(args, cq.UserID)
		argIndex++
	}

	if cq.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, cq.Status)
		argIndex++
	}

	if cq.PolicyID != "" {
		query += fmt.Sprintf(" AND policy_id = $%d", argIndex)
		args = append(args, cq.PolicyID)
		argIndex++
	}

	return query, args
}

// InsertCapsuleQuery builds insert query for new capsule
func BuildInsertCapsuleQuery() string {
	return `
		INSERT INTO capsules (
			id, data_hash, policy_id, created_at, updated_at,
			created_by, access_count, status, expiry_date, metadata
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		) RETURNING id
	`
}

// UpdateCapsuleQuery builds update query for capsule
func BuildUpdateCapsuleQuery(fields []string) string {
	query := "UPDATE capsules SET updated_at = NOW()"

	argIndex := 1
	for _, field := range fields {
		query += fmt.Sprintf(", %s = $%d", field, argIndex)
		argIndex++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argIndex)
	return query
}

// AccessLogQuery builds query for recording access
func BuildAccessLogQuery() string {
	return `
		UPDATE capsules 
		SET access_count = access_count + 1, 
		    last_accessed = NOW(),
		    updated_at = NOW()
		WHERE id = $1
	`
}

// ExpiredCapsulesQuery builds query for finding expired capsules
func BuildExpiredCapsulesQuery() string {
	return `
		SELECT id, data_hash, policy_id, created_at, updated_at,
		       created_by, access_count, last_accessed, status,
		       expiry_date, metadata
		FROM capsules
		WHERE expiry_date < NOW() AND status = 'active'
		LIMIT $1
	`
}

// CapsuleStatsQuery builds query for capsule statistics
func BuildCapsuleStatsQuery(userID string) (string, []interface{}) {
	query := `
		SELECT 
			COUNT(*) as total_capsules,
			COUNT(CASE WHEN status = 'active' THEN 1 END) as active_capsules,
			COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked_capsules,
			COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_capsules,
			COALESCE(SUM(access_count), 0) as total_accesses,
			COALESCE(AVG(access_count), 0) as avg_accesses
		FROM capsules
	`

	args := []interface{}{}

	if userID != "" {
		query += " WHERE created_by = $1"
		args = append(args, userID)
	}

	return query, args
}

// ValidateCapsuleFields validates capsule field values
func ValidateCapsuleFields(c *Capsule) error {
	if c.ID == "" {
		return fmt.Errorf("capsule ID is required")
	}

	if c.DataHash == "" {
		return fmt.Errorf("data hash is required")
	}

	if c.PolicyID != nil && *c.PolicyID == "" {
		return fmt.Errorf("policy ID cannot be empty string")
	}

	if c.OwnerID == "" {
		return fmt.Errorf("owner ID is required")
	}

	return nil
}

// PrepareInsertArgs prepares arguments for capsule insertion
func PrepareInsertArgs(c *Capsule) []interface{} {
	var expiresAt interface{}
	if c.ExpiresAt != nil {
		expiresAt = *c.ExpiresAt
	}

	var lockedUntil interface{}
	if c.LockedUntil != nil {
		lockedUntil = *c.LockedUntil
	}

	var metadata interface{}
	if c.Metadata != nil {
		metadata = string(c.Metadata)
	}

	return []interface{}{
		c.ID,
		c.OwnerID,
		c.DataHash,
		c.PolicyID,
		c.CreatedAt,
		c.UpdatedAt,
		expiresAt,
		c.Revoked,
		c.SelfDestruct,
		c.AccessCount,
		lockedUntil,
		c.SizeBytes,
		metadata,
	}
}

// LogDatabaseOperation logs database operations for debugging
func LogDatabaseOperation(operation, query string, args []interface{}) {
	log.Debug().
		Str("operation", operation).
		Str("query", query).
		Interface("args", args).
		Msg("Database operation")
}
