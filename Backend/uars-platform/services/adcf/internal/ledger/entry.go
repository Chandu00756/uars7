package ledger

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

// LogEntry represents a single entry in the audit ledger
type LogEntry struct {
	ID            string          `json:"id" db:"id"`
	Timestamp     time.Time       `json:"timestamp" db:"timestamp"`
	Level         string          `json:"level" db:"level"`
	Source        string          `json:"source" db:"source"`
	Event         string          `json:"event" db:"event"`
	UserID        string          `json:"user_id" db:"user_id"`
	IPAddress     *string         `json:"ip_address" db:"ip_address"`
	UserAgent     *string         `json:"user_agent" db:"user_agent"`
	SessionID     *string         `json:"session_id" db:"session_id"`
	RequestID     *string         `json:"request_id" db:"request_id"`
	DeviceID      *string         `json:"device_id" db:"device_id"`
	GeoLocation   *string         `json:"geo_location" db:"geo_location"`
	Result        string          `json:"result" db:"result"`
	Data          json.RawMessage `json:"data" db:"data"`
	Hash          string          `json:"hash" db:"hash"`
	PreviousHash  string          `json:"previous_hash" db:"previous_hash"`
	Signature     *string         `json:"signature" db:"signature"`
	Verified      bool            `json:"verified" db:"verified"`
	ChainPosition int64           `json:"chain_position" db:"chain_position"`
}

// EntryBuilder provides a fluent interface for building log entries
type EntryBuilder struct {
	entry *LogEntry
}

// NewEntryBuilder creates a new entry builder
func NewEntryBuilder() *EntryBuilder {
	return &EntryBuilder{
		entry: &LogEntry{
			ID:        generateEntryID(),
			Timestamp: time.Now(),
			Level:     "INFO",
			Verified:  false,
		},
	}
}

// WithID sets the entry ID
func (eb *EntryBuilder) WithID(id string) *EntryBuilder {
	eb.entry.ID = id
	return eb
}

// WithTimestamp sets the timestamp
func (eb *EntryBuilder) WithTimestamp(timestamp time.Time) *EntryBuilder {
	eb.entry.Timestamp = timestamp
	return eb
}

// WithLevel sets the log level
func (eb *EntryBuilder) WithLevel(level string) *EntryBuilder {
	eb.entry.Level = level
	return eb
}

// WithSource sets the source component
func (eb *EntryBuilder) WithSource(source string) *EntryBuilder {
	eb.entry.Source = source
	return eb
}

// WithEvent sets the event type
func (eb *EntryBuilder) WithEvent(event string) *EntryBuilder {
	eb.entry.Event = event
	return eb
}

// WithUserID sets the user ID
func (eb *EntryBuilder) WithUserID(userID string) *EntryBuilder {
	eb.entry.UserID = userID
	return eb
}

// WithIPAddress sets the IP address
func (eb *EntryBuilder) WithIPAddress(ipAddress string) *EntryBuilder {
	eb.entry.IPAddress = &ipAddress
	return eb
}

// WithUserAgent sets the user agent
func (eb *EntryBuilder) WithUserAgent(userAgent string) *EntryBuilder {
	eb.entry.UserAgent = &userAgent
	return eb
}

// WithSessionID sets the session ID
func (eb *EntryBuilder) WithSessionID(sessionID string) *EntryBuilder {
	eb.entry.SessionID = &sessionID
	return eb
}

// WithRequestID sets the request ID
func (eb *EntryBuilder) WithRequestID(requestID string) *EntryBuilder {
	eb.entry.RequestID = &requestID
	return eb
}

// WithDeviceID sets the device ID
func (eb *EntryBuilder) WithDeviceID(deviceID string) *EntryBuilder {
	eb.entry.DeviceID = &deviceID
	return eb
}

// WithGeoLocation sets the geographic location
func (eb *EntryBuilder) WithGeoLocation(geoLocation string) *EntryBuilder {
	eb.entry.GeoLocation = &geoLocation
	return eb
}

// WithResult sets the operation result
func (eb *EntryBuilder) WithResult(result string) *EntryBuilder {
	eb.entry.Result = result
	return eb
}

// WithData sets the entry data
func (eb *EntryBuilder) WithData(data interface{}) *EntryBuilder {
	if data != nil {
		if dataJSON, err := json.Marshal(data); err == nil {
			eb.entry.Data = dataJSON
		} else {
			log.Error().Err(err).Msg("Failed to marshal entry data")
		}
	}
	return eb
}

// WithRawData sets raw JSON data
func (eb *EntryBuilder) WithRawData(data json.RawMessage) *EntryBuilder {
	eb.entry.Data = data
	return eb
}

// WithSignature sets the cryptographic signature
func (eb *EntryBuilder) WithSignature(signature string) *EntryBuilder {
	eb.entry.Signature = &signature
	return eb
}

// WithChainPosition sets the position in the blockchain
func (eb *EntryBuilder) WithChainPosition(position int64) *EntryBuilder {
	eb.entry.ChainPosition = position
	return eb
}

// Build creates the final log entry with hash computation
func (eb *EntryBuilder) Build() *LogEntry {
	// Compute hash of the entry
	eb.entry.Hash = eb.computeHash()
	return eb.entry
}

// computeHash computes the hash of the log entry
func (eb *EntryBuilder) computeHash() string {
	// Create a hashable representation of the entry
	hashData := struct {
		ID          string          `json:"id"`
		Timestamp   time.Time       `json:"timestamp"`
		Level       string          `json:"level"`
		Source      string          `json:"source"`
		Event       string          `json:"event"`
		UserID      string          `json:"user_id"`
		IPAddress   *string         `json:"ip_address"`
		UserAgent   *string         `json:"user_agent"`
		SessionID   *string         `json:"session_id"`
		RequestID   *string         `json:"request_id"`
		DeviceID    *string         `json:"device_id"`
		GeoLocation *string         `json:"geo_location"`
		Result      string          `json:"result"`
		Data        json.RawMessage `json:"data"`
	}{
		ID:          eb.entry.ID,
		Timestamp:   eb.entry.Timestamp,
		Level:       eb.entry.Level,
		Source:      eb.entry.Source,
		Event:       eb.entry.Event,
		UserID:      eb.entry.UserID,
		IPAddress:   eb.entry.IPAddress,
		UserAgent:   eb.entry.UserAgent,
		SessionID:   eb.entry.SessionID,
		RequestID:   eb.entry.RequestID,
		DeviceID:    eb.entry.DeviceID,
		GeoLocation: eb.entry.GeoLocation,
		Result:      eb.entry.Result,
		Data:        eb.entry.Data,
	}

	hashJSON, err := json.Marshal(hashData)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal hash data")
		return ""
	}

	// In a real implementation, use a proper cryptographic hash like SHA-256
	// For now, return a simple hash representation
	return fmt.Sprintf("hash_%x", len(hashJSON))
}

// EntryValidator provides validation for log entries
type EntryValidator struct{}

// NewEntryValidator creates a new entry validator
func NewEntryValidator() *EntryValidator {
	return &EntryValidator{}
}

// Validate validates a log entry
func (ev *EntryValidator) Validate(entry *LogEntry) error {
	if entry == nil {
		return fmt.Errorf("log entry is nil")
	}

	if entry.ID == "" {
		return fmt.Errorf("entry ID is required")
	}

	if entry.Event == "" {
		return fmt.Errorf("event type is required")
	}

	if entry.UserID == "" {
		return fmt.Errorf("user ID is required")
	}

	if entry.Source == "" {
		return fmt.Errorf("source is required")
	}

	if entry.Result == "" {
		return fmt.Errorf("result is required")
	}

	// Validate log level
	validLevels := map[string]bool{
		"DEBUG":    true,
		"INFO":     true,
		"WARN":     true,
		"ERROR":    true,
		"CRITICAL": true,
	}

	if !validLevels[entry.Level] {
		return fmt.Errorf("invalid log level: %s", entry.Level)
	}

	// Validate result
	validResults := map[string]bool{
		"SUCCESS": true,
		"FAILURE": true,
		"DENIED":  true,
		"ERROR":   true,
		"PENDING": true,
	}

	if !validResults[entry.Result] {
		return fmt.Errorf("invalid result: %s", entry.Result)
	}

	return nil
}

// ValidateChain validates a chain of log entries
func (ev *EntryValidator) ValidateChain(entries []*LogEntry) error {
	if len(entries) == 0 {
		return nil
	}

	for i, entry := range entries {
		if err := ev.Validate(entry); err != nil {
			return fmt.Errorf("entry %d invalid: %w", i, err)
		}

		// Validate chain linkage
		if i > 0 {
			previousEntry := entries[i-1]
			if entry.PreviousHash != previousEntry.Hash {
				return fmt.Errorf("chain broken at entry %d: previous hash mismatch", i)
			}

			if entry.ChainPosition != previousEntry.ChainPosition+1 {
				return fmt.Errorf("chain position mismatch at entry %d", i)
			}
		}
	}

	return nil
}

// EntryQuery represents parameters for querying log entries
type EntryQuery struct {
	UserID    string
	Event     string
	Level     string
	Source    string
	Result    string
	FromTime  time.Time
	ToTime    time.Time
	IPAddress string
	SessionID string
	DeviceID  string
	Limit     int
	Offset    int
	OrderBy   string
	OrderDesc bool
}

// BuildQuery builds a SQL query from the entry query parameters
func (eq *EntryQuery) BuildQuery() (string, []interface{}) {
	query := `
		SELECT id, timestamp, level, source, event, user_id,
		       ip_address, user_agent, session_id, request_id,
		       device_id, geo_location, result, data, hash,
		       previous_hash, signature, verified, chain_position
		FROM audit_logs
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if eq.UserID != "" {
		query += fmt.Sprintf(" AND user_id = $%d", argIndex)
		args = append(args, eq.UserID)
		argIndex++
	}

	if eq.Event != "" {
		query += fmt.Sprintf(" AND event = $%d", argIndex)
		args = append(args, eq.Event)
		argIndex++
	}

	if eq.Level != "" {
		query += fmt.Sprintf(" AND level = $%d", argIndex)
		args = append(args, eq.Level)
		argIndex++
	}

	if eq.Source != "" {
		query += fmt.Sprintf(" AND source = $%d", argIndex)
		args = append(args, eq.Source)
		argIndex++
	}

	if eq.Result != "" {
		query += fmt.Sprintf(" AND result = $%d", argIndex)
		args = append(args, eq.Result)
		argIndex++
	}

	if !eq.FromTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp >= $%d", argIndex)
		args = append(args, eq.FromTime)
		argIndex++
	}

	if !eq.ToTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp <= $%d", argIndex)
		args = append(args, eq.ToTime)
		argIndex++
	}

	if eq.IPAddress != "" {
		query += fmt.Sprintf(" AND ip_address = $%d", argIndex)
		args = append(args, eq.IPAddress)
		argIndex++
	}

	if eq.SessionID != "" {
		query += fmt.Sprintf(" AND session_id = $%d", argIndex)
		args = append(args, eq.SessionID)
		argIndex++
	}

	if eq.DeviceID != "" {
		query += fmt.Sprintf(" AND device_id = $%d", argIndex)
		args = append(args, eq.DeviceID)
		argIndex++
	}

	// Add ordering
	orderBy := "timestamp"
	if eq.OrderBy != "" {
		orderBy = eq.OrderBy
	}

	direction := "ASC"
	if eq.OrderDesc {
		direction = "DESC"
	}

	query += fmt.Sprintf(" ORDER BY %s %s", orderBy, direction)

	// Add pagination
	if eq.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, eq.Limit)
		argIndex++
	}

	if eq.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, eq.Offset)
		argIndex++
	}

	return query, args
}

// Helper functions

func generateEntryID() string {
	return fmt.Sprintf("entry_%d", time.Now().UnixNano())
}

// GetEntrySize calculates the size of a log entry in bytes
func GetEntrySize(entry *LogEntry) int64 {
	entryJSON, err := json.Marshal(entry)
	if err != nil {
		return 0
	}
	return int64(len(entryJSON))
}

// SanitizeEntry removes sensitive information from a log entry for external use
func SanitizeEntry(entry *LogEntry) *LogEntry {
	sanitized := *entry

	// Remove or mask sensitive fields
	if sanitized.IPAddress != nil {
		masked := maskIPAddress(*sanitized.IPAddress)
		sanitized.IPAddress = &masked
	}

	if sanitized.UserAgent != nil {
		masked := maskUserAgent(*sanitized.UserAgent)
		sanitized.UserAgent = &masked
	}

	// Remove signature for external viewing
	sanitized.Signature = nil

	return &sanitized
}

func maskIPAddress(ip string) string {
	// Simple IP masking - in production use proper anonymization
	if len(ip) > 4 {
		return ip[:4] + "***"
	}
	return "***"
}

func maskUserAgent(ua string) string {
	// Simple user agent masking
	if len(ua) > 10 {
		return ua[:10] + "***"
	}
	return "***"
}
