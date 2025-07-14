package ledger

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
)

// Action represents different types of actions that can be logged
type Action string

const (
	ActionCapsuleCreate  Action = "CAPSULE_CREATE"
	ActionCapsuleAccess  Action = "CAPSULE_ACCESS"
	ActionCapsuleRevoke  Action = "CAPSULE_REVOKE"
	ActionCapsuleUpdate  Action = "CAPSULE_UPDATE"
	ActionCapsuleDelete  Action = "CAPSULE_DELETE"
	ActionCapsuleExpire  Action = "CAPSULE_EXPIRE"
	ActionPolicyCreate   Action = "POLICY_CREATE"
	ActionPolicyUpdate   Action = "POLICY_UPDATE"
	ActionPolicyValidate Action = "POLICY_VALIDATE"
	ActionSystemStart    Action = "SYSTEM_START"
	ActionSystemShutdown Action = "SYSTEM_SHUTDOWN"
	ActionAuthLogin      Action = "AUTH_LOGIN"
	ActionAuthLogout     Action = "AUTH_LOGOUT"
	ActionSecurityAlert  Action = "SECURITY_ALERT"
)

// ActionContext contains contextual information for an action
type ActionContext struct {
	UserID      string                 `json:"user_id"`
	SessionID   string                 `json:"session_id"`
	RequestID   string                 `json:"request_id"`
	IPAddress   string                 `json:"ip_address"`
	UserAgent   string                 `json:"user_agent"`
	DeviceID    string                 `json:"device_id"`
	GeoLocation string                 `json:"geo_location"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// ActionResult represents the result of an action
type ActionResult string

const (
	ActionResultSuccess ActionResult = "SUCCESS"
	ActionResultFailure ActionResult = "FAILURE"
	ActionResultDenied  ActionResult = "DENIED"
	ActionResultError   ActionResult = "ERROR"
)

// ActionDetails contains detailed information about an action
type ActionDetails struct {
	Action        Action                 `json:"action"`
	ResourceType  string                 `json:"resource_type"`
	ResourceID    string                 `json:"resource_id"`
	Result        ActionResult           `json:"result"`
	Message       string                 `json:"message"`
	ErrorCode     string                 `json:"error_code,omitempty"`
	Duration      time.Duration          `json:"duration"`
	DataSize      int64                  `json:"data_size,omitempty"`
	Context       *ActionContext         `json:"context"`
	Attributes    map[string]interface{} `json:"attributes"`
	Timestamp     time.Time              `json:"timestamp"`
	CorrelationID string                 `json:"correlation_id"`
}

// ActionLogger provides methods for logging different types of actions
type ActionLogger struct {
	// No logger field needed - we'll use the package-level Log function
}

// NewActionLogger creates a new action logger
func NewActionLogger() *ActionLogger {
	return &ActionLogger{}
}

// LogCapsuleAction logs capsule-related actions
func (al *ActionLogger) LogCapsuleAction(
	action Action,
	capsuleID string,
	result ActionResult,
	context *ActionContext,
	attributes map[string]interface{},
) error {
	details := &ActionDetails{
		Action:        action,
		ResourceType:  "capsule",
		ResourceID:    capsuleID,
		Result:        result,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogPolicyAction logs policy-related actions
func (al *ActionLogger) LogPolicyAction(
	action Action,
	policyID string,
	result ActionResult,
	context *ActionContext,
	attributes map[string]interface{},
) error {
	details := &ActionDetails{
		Action:        action,
		ResourceType:  "policy",
		ResourceID:    policyID,
		Result:        result,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogSystemAction logs system-related actions
func (al *ActionLogger) LogSystemAction(
	action Action,
	result ActionResult,
	context *ActionContext,
	attributes map[string]interface{},
) error {
	details := &ActionDetails{
		Action:        action,
		ResourceType:  "system",
		ResourceID:    "adcf-service",
		Result:        result,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogSecurityAction logs security-related actions
func (al *ActionLogger) LogSecurityAction(
	action Action,
	resourceType string,
	resourceID string,
	result ActionResult,
	context *ActionContext,
	securityLevel string,
	attributes map[string]interface{},
) error {
	if attributes == nil {
		attributes = make(map[string]interface{})
	}
	attributes["security_level"] = securityLevel
	attributes["alert_type"] = "security_event"

	details := &ActionDetails{
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		Result:        result,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogAuthenticationAction logs authentication-related actions
func (al *ActionLogger) LogAuthenticationAction(
	action Action,
	userID string,
	result ActionResult,
	context *ActionContext,
	authMethod string,
	attributes map[string]interface{},
) error {
	if attributes == nil {
		attributes = make(map[string]interface{})
	}
	attributes["auth_method"] = authMethod

	details := &ActionDetails{
		Action:        action,
		ResourceType:  "user",
		ResourceID:    userID,
		Result:        result,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogDataAction logs data-related actions with size and encryption info
func (al *ActionLogger) LogDataAction(
	action Action,
	resourceType string,
	resourceID string,
	result ActionResult,
	context *ActionContext,
	dataSize int64,
	encryptionAlgorithm string,
	attributes map[string]interface{},
) error {
	if attributes == nil {
		attributes = make(map[string]interface{})
	}
	attributes["encryption_algorithm"] = encryptionAlgorithm

	details := &ActionDetails{
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		Result:        result,
		DataSize:      dataSize,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// LogPerformanceAction logs performance-related actions with timing information
func (al *ActionLogger) LogPerformanceAction(
	action Action,
	resourceType string,
	resourceID string,
	result ActionResult,
	context *ActionContext,
	duration time.Duration,
	attributes map[string]interface{},
) error {
	if attributes == nil {
		attributes = make(map[string]interface{})
	}
	attributes["performance_metric"] = true

	details := &ActionDetails{
		Action:        action,
		ResourceType:  resourceType,
		ResourceID:    resourceID,
		Result:        result,
		Duration:      duration,
		Context:       context,
		Attributes:    attributes,
		Timestamp:     time.Now(),
		CorrelationID: generateCorrelationID(),
	}

	return al.logAction(details)
}

// logAction logs an action to the ledger
func (al *ActionLogger) logAction(details *ActionDetails) error {
	// Convert action details to the Entry format used by the ledger
	entry := Entry{
		ID:        generateEntryID(),
		Timestamp: details.Timestamp,
		CapsuleID: details.ResourceID, // Use ResourceID as CapsuleID
		Action:    string(details.Action),
		ActorID:   details.Context.UserID,
		Metadata:  details.Attributes,
	}

	// Compute hash of the entry
	entryJSON, err := json.Marshal(entry)
	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal entry for hashing")
		return fmt.Errorf("failed to marshal entry: %w", err)
	}

	hash := sha256.Sum256(entryJSON)
	entry.Hash = hex.EncodeToString(hash[:])

	// Log using the package-level Log function
	Log(entry)

	// Log to console for debugging
	log.Info().
		Str("action", string(details.Action)).
		Str("resource_type", details.ResourceType).
		Str("resource_id", details.ResourceID).
		Str("result", string(details.Result)).
		Str("user_id", details.Context.UserID).
		Str("correlation_id", details.CorrelationID).
		Msg("Action logged")

	return nil
}

// Validation functions

// ValidateAction validates that an action is known and supported
func ValidateAction(action Action) error {
	validActions := map[Action]bool{
		ActionCapsuleCreate:  true,
		ActionCapsuleAccess:  true,
		ActionCapsuleRevoke:  true,
		ActionCapsuleUpdate:  true,
		ActionCapsuleDelete:  true,
		ActionCapsuleExpire:  true,
		ActionPolicyCreate:   true,
		ActionPolicyUpdate:   true,
		ActionPolicyValidate: true,
		ActionSystemStart:    true,
		ActionSystemShutdown: true,
		ActionAuthLogin:      true,
		ActionAuthLogout:     true,
		ActionSecurityAlert:  true,
	}

	if !validActions[action] {
		return fmt.Errorf("invalid action: %s", action)
	}

	return nil
}

// ValidateActionContext validates action context
func ValidateActionContext(context *ActionContext) error {
	if context == nil {
		return fmt.Errorf("action context is required")
	}

	if context.UserID == "" {
		return fmt.Errorf("user ID is required in action context")
	}

	return nil
}

// Helper functions

func generateCorrelationID() string {
	return fmt.Sprintf("corr_%d", time.Now().UnixNano())
}

// GetActionSeverity returns the severity level for an action
func GetActionSeverity(action Action, result ActionResult) string {
	// Security-related actions always have high severity
	securityActions := map[Action]bool{
		ActionSecurityAlert: true,
		ActionAuthLogin:     true,
		ActionAuthLogout:    true,
	}

	if securityActions[action] {
		if result == ActionResultFailure || result == ActionResultDenied {
			return "CRITICAL"
		}
		return "HIGH"
	}

	// Failed operations have higher severity
	if result == ActionResultFailure || result == ActionResultError {
		return "MEDIUM"
	}

	// Denied operations
	if result == ActionResultDenied {
		return "HIGH"
	}

	// Successful operations
	return "LOW"
}

// GetActionCategory returns the category for an action
func GetActionCategory(action Action) string {
	categories := map[Action]string{
		ActionCapsuleCreate:  "data_management",
		ActionCapsuleAccess:  "data_access",
		ActionCapsuleRevoke:  "data_management",
		ActionCapsuleUpdate:  "data_management",
		ActionCapsuleDelete:  "data_management",
		ActionCapsuleExpire:  "data_lifecycle",
		ActionPolicyCreate:   "policy_management",
		ActionPolicyUpdate:   "policy_management",
		ActionPolicyValidate: "policy_enforcement",
		ActionSystemStart:    "system_lifecycle",
		ActionSystemShutdown: "system_lifecycle",
		ActionAuthLogin:      "authentication",
		ActionAuthLogout:     "authentication",
		ActionSecurityAlert:  "security",
	}

	if category, exists := categories[action]; exists {
		return category
	}

	return "unknown"
}
