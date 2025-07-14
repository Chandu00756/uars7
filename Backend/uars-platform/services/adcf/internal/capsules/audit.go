package capsules

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

// AuditLogger handles audit logging for capsule operations
type AuditLogger struct {
	store *Store
}

// NewAuditLogger creates a new audit logger
func NewAuditLogger(store *Store) *AuditLogger {
	return &AuditLogger{
		store: store,
	}
}

// AuditOperation represents different types of operations that can be audited
type AuditOperation string

const (
	AuditOperationCreate   AuditOperation = "CREATE"
	AuditOperationAccess   AuditOperation = "ACCESS"
	AuditOperationRevoke   AuditOperation = "REVOKE"
	AuditOperationUpdate   AuditOperation = "UPDATE"
	AuditOperationDelete   AuditOperation = "DELETE"
	AuditOperationExpire   AuditOperation = "EXPIRE"
	AuditOperationValidate AuditOperation = "VALIDATE"
)

// AuditContext contains context information for audit entries
type AuditContext struct {
	Operation     AuditOperation         `json:"operation"`
	CapsuleID     string                 `json:"capsule_id"`
	UserID        string                 `json:"user_id"`
	IPAddress     string                 `json:"ip_address"`
	UserAgent     string                 `json:"user_agent"`
	RequestID     string                 `json:"request_id"`
	Success       bool                   `json:"success"`
	ErrorMessage  string                 `json:"error_message,omitempty"`
	Details       map[string]interface{} `json:"details,omitempty"`
	Timestamp     time.Time              `json:"timestamp"`
	SessionID     string                 `json:"session_id,omitempty"`
	DeviceID      string                 `json:"device_id,omitempty"`
	PolicyID      string                 `json:"policy_id,omitempty"`
	DataSize      int64                  `json:"data_size,omitempty"`
	EncryptionAlg string                 `json:"encryption_algorithm,omitempty"`
}

// LogCapsuleCreation logs the creation of a new capsule
func (al *AuditLogger) LogCapsuleCreation(ctx context.Context, capsule *Capsule, userContext *AuditContext) error {
	auditCtx := &AuditContext{
		Operation:     AuditOperationCreate,
		CapsuleID:     capsule.ID,
		UserID:        userContext.UserID,
		IPAddress:     userContext.IPAddress,
		UserAgent:     userContext.UserAgent,
		RequestID:     userContext.RequestID,
		Success:       true,
		Timestamp:     time.Now(),
		SessionID:     userContext.SessionID,
		DeviceID:      userContext.DeviceID,
		DataSize:      capsule.SizeBytes,
		EncryptionAlg: userContext.EncryptionAlg,
		Details: map[string]interface{}{
			"owner_id":      capsule.OwnerID,
			"policy_id":     capsule.PolicyID,
			"self_destruct": capsule.SelfDestruct,
			"expires_at":    capsule.ExpiresAt,
			"metadata_size": len(capsule.Metadata),
		},
	}

	if capsule.PolicyID != nil {
		auditCtx.PolicyID = *capsule.PolicyID
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogCapsuleAccess logs access to a capsule
func (al *AuditLogger) LogCapsuleAccess(ctx context.Context, capsuleID string, userContext *AuditContext, accessGranted bool, reason string) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationAccess,
		CapsuleID: capsuleID,
		UserID:    userContext.UserID,
		IPAddress: userContext.IPAddress,
		UserAgent: userContext.UserAgent,
		RequestID: userContext.RequestID,
		Success:   accessGranted,
		Timestamp: time.Now(),
		SessionID: userContext.SessionID,
		DeviceID:  userContext.DeviceID,
		PolicyID:  userContext.PolicyID,
		Details: map[string]interface{}{
			"access_granted": accessGranted,
			"reason":         reason,
		},
	}

	if !accessGranted {
		auditCtx.ErrorMessage = reason
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogCapsuleRevocation logs the revocation of a capsule
func (al *AuditLogger) LogCapsuleRevocation(ctx context.Context, capsuleID string, userContext *AuditContext, reason string) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationRevoke,
		CapsuleID: capsuleID,
		UserID:    userContext.UserID,
		IPAddress: userContext.IPAddress,
		UserAgent: userContext.UserAgent,
		RequestID: userContext.RequestID,
		Success:   true,
		Timestamp: time.Now(),
		SessionID: userContext.SessionID,
		DeviceID:  userContext.DeviceID,
		Details: map[string]interface{}{
			"revocation_reason": reason,
		},
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogCapsuleUpdate logs updates to a capsule
func (al *AuditLogger) LogCapsuleUpdate(ctx context.Context, capsuleID string, userContext *AuditContext, changedFields []string) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationUpdate,
		CapsuleID: capsuleID,
		UserID:    userContext.UserID,
		IPAddress: userContext.IPAddress,
		UserAgent: userContext.UserAgent,
		RequestID: userContext.RequestID,
		Success:   true,
		Timestamp: time.Now(),
		SessionID: userContext.SessionID,
		DeviceID:  userContext.DeviceID,
		Details: map[string]interface{}{
			"changed_fields": changedFields,
		},
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogCapsuleDeletion logs the deletion of a capsule
func (al *AuditLogger) LogCapsuleDeletion(ctx context.Context, capsuleID string, userContext *AuditContext, reason string) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationDelete,
		CapsuleID: capsuleID,
		UserID:    userContext.UserID,
		IPAddress: userContext.IPAddress,
		UserAgent: userContext.UserAgent,
		RequestID: userContext.RequestID,
		Success:   true,
		Timestamp: time.Now(),
		SessionID: userContext.SessionID,
		DeviceID:  userContext.DeviceID,
		Details: map[string]interface{}{
			"deletion_reason": reason,
		},
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogCapsuleExpiration logs the expiration of a capsule
func (al *AuditLogger) LogCapsuleExpiration(ctx context.Context, capsuleID string, automaticCleanup bool) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationExpire,
		CapsuleID: capsuleID,
		UserID:    "system",
		Success:   true,
		Timestamp: time.Now(),
		Details: map[string]interface{}{
			"automatic_cleanup": automaticCleanup,
			"expiration_time":   time.Now(),
		},
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogPolicyValidation logs policy validation events
func (al *AuditLogger) LogPolicyValidation(ctx context.Context, capsuleID string, policyID string, userContext *AuditContext, validationResult bool, details map[string]interface{}) error {
	auditCtx := &AuditContext{
		Operation: AuditOperationValidate,
		CapsuleID: capsuleID,
		PolicyID:  policyID,
		UserID:    userContext.UserID,
		IPAddress: userContext.IPAddress,
		UserAgent: userContext.UserAgent,
		RequestID: userContext.RequestID,
		Success:   validationResult,
		Timestamp: time.Now(),
		SessionID: userContext.SessionID,
		DeviceID:  userContext.DeviceID,
		Details:   details,
	}

	if !validationResult {
		auditCtx.ErrorMessage = "Policy validation failed"
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// LogOperationFailure logs failed operations
func (al *AuditLogger) LogOperationFailure(ctx context.Context, operation AuditOperation, capsuleID string, userContext *AuditContext, errorMsg string, details map[string]interface{}) error {
	auditCtx := &AuditContext{
		Operation:    operation,
		CapsuleID:    capsuleID,
		UserID:       userContext.UserID,
		IPAddress:    userContext.IPAddress,
		UserAgent:    userContext.UserAgent,
		RequestID:    userContext.RequestID,
		Success:      false,
		ErrorMessage: errorMsg,
		Timestamp:    time.Now(),
		SessionID:    userContext.SessionID,
		DeviceID:     userContext.DeviceID,
		Details:      details,
	}

	return al.writeAuditLog(ctx, auditCtx)
}

// writeAuditLog writes an audit log entry to the database
func (al *AuditLogger) writeAuditLog(ctx context.Context, auditCtx *AuditContext) error {
	// Convert audit context to audit entry
	auditEntry := &AuditEntry{
		ID:        generateAuditID(),
		CapsuleID: &auditCtx.CapsuleID,
		Action:    string(auditCtx.Operation),
		ActorID:   auditCtx.UserID,
		IPAddress: &auditCtx.IPAddress,
		UserAgent: &auditCtx.UserAgent,
		Success:   auditCtx.Success,
		Timestamp: auditCtx.Timestamp,
	}

	if auditCtx.PolicyID != "" {
		auditEntry.PolicyID = &auditCtx.PolicyID
	}

	if auditCtx.ErrorMessage != "" {
		auditEntry.ErrorMessage = &auditCtx.ErrorMessage
	}

	// Convert details to JSON
	if auditCtx.Details != nil {
		detailsJSON, err := json.Marshal(auditCtx.Details)
		if err != nil {
			log.Error().Err(err).Msg("Failed to marshal audit details")
		} else {
			auditEntry.Details = detailsJSON
		}
	}

	// Add error message to details if present and no existing details
	if auditCtx.ErrorMessage != "" && auditEntry.Details == nil {
		errorData := map[string]interface{}{
			"error_message": auditCtx.ErrorMessage,
		}
		if errorJSON, err := json.Marshal(errorData); err == nil {
			auditEntry.Details = errorJSON
		}
	}

	// Store the audit entry (this would use the ledger package in a real implementation)
	log.Info().
		Str("operation", string(auditCtx.Operation)).
		Str("capsule_id", auditCtx.CapsuleID).
		Str("user_id", auditCtx.UserID).
		Bool("success", auditCtx.Success).
		Msg("Audit log recorded")

	return nil
}

// Helper functions

func generateAuditID() string {
	return fmt.Sprintf("audit_%d", time.Now().UnixNano())
}

func getAuditResult(success bool) string {
	if success {
		return "SUCCESS"
	}
	return "FAILURE"
}

func getGeoLocation(ipAddress string) *string {
	// In a real implementation, this would use a GeoIP service
	// For now, return a placeholder
	location := "Unknown"
	return &location
}

// AuditQueryParams represents parameters for querying audit logs
type AuditQueryParams struct {
	CapsuleID string
	UserID    string
	Operation AuditOperation
	FromTime  time.Time
	ToTime    time.Time
	Success   *bool
	Limit     int
	Offset    int
}

// QueryAuditLogs retrieves audit logs based on the given parameters
func (al *AuditLogger) QueryAuditLogs(ctx context.Context, params *AuditQueryParams) ([]*AuditEntry, error) {
	// This would implement querying audit logs from the ledger/database
	// For now, return empty slice
	log.Info().
		Interface("params", params).
		Msg("Querying audit logs")

	return []*AuditEntry{}, nil
}

// GetAuditSummary retrieves a summary of audit activities
func (al *AuditLogger) GetAuditSummary(ctx context.Context, capsuleID string, timeRange time.Duration) (*AuditSummary, error) {
	// This would implement audit summary generation
	summary := &AuditSummary{
		CapsuleID:     capsuleID,
		TotalEvents:   0,
		SuccessEvents: 0,
		FailureEvents: 0,
		Operations:    make(map[string]int),
		TimeRange:     timeRange,
		GeneratedAt:   time.Now(),
	}

	return summary, nil
}

// AuditSummary represents a summary of audit activities
type AuditSummary struct {
	CapsuleID     string                 `json:"capsule_id"`
	TotalEvents   int                    `json:"total_events"`
	SuccessEvents int                    `json:"success_events"`
	FailureEvents int                    `json:"failure_events"`
	Operations    map[string]int         `json:"operations"`
	TimeRange     time.Duration          `json:"time_range"`
	GeneratedAt   time.Time              `json:"generated_at"`
	Details       map[string]interface{} `json:"details,omitempty"`
}
