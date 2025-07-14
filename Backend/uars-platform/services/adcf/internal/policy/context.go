package policy

import (
	"encoding/json"
	"fmt"
	"net"
	"time"

	"github.com/rs/zerolog/log"
)

// Context represents the evaluation context for policy decisions
type Context struct {
	// Request Information
	RequestID string    `json:"request_id"`
	Timestamp time.Time `json:"timestamp"`
	Operation string    `json:"operation"`
	Resource  *Resource `json:"resource"`

	// User/Actor Information
	UserID         string                 `json:"user_id"`
	UserRoles      []string               `json:"user_roles"`
	UserGroups     []string               `json:"user_groups"`
	UserAttributes map[string]interface{} `json:"user_attributes"`

	// Device Information
	DeviceID       string `json:"device_id"`
	DeviceType     string `json:"device_type"`
	DeviceTrust    string `json:"device_trust"`
	DeviceAttested bool   `json:"device_attested"`

	// Network Information
	IPAddress   string `json:"ip_address"`
	IPCountry   string `json:"ip_country"`
	IPCity      string `json:"ip_city"`
	NetworkZone string `json:"network_zone"`
	VPNDetected bool   `json:"vpn_detected"`

	// Session Information
	SessionID   string        `json:"session_id"`
	SessionAge  time.Duration `json:"session_age"`
	AuthMethod  string        `json:"auth_method"`
	MFAVerified bool          `json:"mfa_verified"`

	// Environmental Information
	TimeOfDay     string `json:"time_of_day"`
	DayOfWeek     string `json:"day_of_week"`
	BusinessHours bool   `json:"business_hours"`

	// Risk Assessment
	RiskScore   float64 `json:"risk_score"`
	ThreatLevel string  `json:"threat_level"`

	// Additional Context
	Intent      *Intent                `json:"intent"`
	Constraints map[string]interface{} `json:"constraints"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// Resource represents the resource being accessed
type Resource struct {
	Type           string                 `json:"type"`
	ID             string                 `json:"id"`
	Classification string                 `json:"classification"`
	Owner          string                 `json:"owner"`
	Attributes     map[string]interface{} `json:"attributes"`
	Tags           []string               `json:"tags"`
}

// Intent represents the declared intent for the operation
type Intent struct {
	Purpose       string                 `json:"purpose"`
	Justification string                 `json:"justification"`
	Duration      time.Duration          `json:"duration"`
	Scope         string                 `json:"scope"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// ContextBuilder provides a fluent interface for building policy contexts
type ContextBuilder struct {
	context *Context
}

// NewContextBuilder creates a new context builder
func NewContextBuilder() *ContextBuilder {
	return &ContextBuilder{
		context: &Context{
			Timestamp:      time.Now(),
			UserAttributes: make(map[string]interface{}),
			Constraints:    make(map[string]interface{}),
			Metadata:       make(map[string]interface{}),
		},
	}
}

// WithRequestID sets the request ID
func (cb *ContextBuilder) WithRequestID(requestID string) *ContextBuilder {
	cb.context.RequestID = requestID
	return cb
}

// WithOperation sets the operation being performed
func (cb *ContextBuilder) WithOperation(operation string) *ContextBuilder {
	cb.context.Operation = operation
	return cb
}

// WithUser sets user information
func (cb *ContextBuilder) WithUser(userID string, roles []string, groups []string) *ContextBuilder {
	cb.context.UserID = userID
	cb.context.UserRoles = roles
	cb.context.UserGroups = groups
	return cb
}

// WithUserAttribute adds a user attribute
func (cb *ContextBuilder) WithUserAttribute(key string, value interface{}) *ContextBuilder {
	cb.context.UserAttributes[key] = value
	return cb
}

// WithDevice sets device information
func (cb *ContextBuilder) WithDevice(deviceID, deviceType, trustLevel string, attested bool) *ContextBuilder {
	cb.context.DeviceID = deviceID
	cb.context.DeviceType = deviceType
	cb.context.DeviceTrust = trustLevel
	cb.context.DeviceAttested = attested
	return cb
}

// WithNetwork sets network information
func (cb *ContextBuilder) WithNetwork(ipAddress, country, city, zone string) *ContextBuilder {
	cb.context.IPAddress = ipAddress
	cb.context.IPCountry = country
	cb.context.IPCity = city
	cb.context.NetworkZone = zone
	return cb
}

// WithSession sets session information
func (cb *ContextBuilder) WithSession(sessionID string, age time.Duration, authMethod string, mfaVerified bool) *ContextBuilder {
	cb.context.SessionID = sessionID
	cb.context.SessionAge = age
	cb.context.AuthMethod = authMethod
	cb.context.MFAVerified = mfaVerified
	return cb
}

// WithResource sets the resource being accessed
func (cb *ContextBuilder) WithResource(resourceType, resourceID, classification, owner string) *ContextBuilder {
	cb.context.Resource = &Resource{
		Type:           resourceType,
		ID:             resourceID,
		Classification: classification,
		Owner:          owner,
		Attributes:     make(map[string]interface{}),
		Tags:           []string{},
	}
	return cb
}

// WithResourceAttribute adds a resource attribute
func (cb *ContextBuilder) WithResourceAttribute(key string, value interface{}) *ContextBuilder {
	if cb.context.Resource == nil {
		cb.context.Resource = &Resource{
			Attributes: make(map[string]interface{}),
			Tags:       []string{},
		}
	}
	cb.context.Resource.Attributes[key] = value
	return cb
}

// WithResourceTag adds a resource tag
func (cb *ContextBuilder) WithResourceTag(tag string) *ContextBuilder {
	if cb.context.Resource == nil {
		cb.context.Resource = &Resource{
			Attributes: make(map[string]interface{}),
			Tags:       []string{},
		}
	}
	cb.context.Resource.Tags = append(cb.context.Resource.Tags, tag)
	return cb
}

// WithIntent sets the declared intent
func (cb *ContextBuilder) WithIntent(purpose, justification string, duration time.Duration) *ContextBuilder {
	cb.context.Intent = &Intent{
		Purpose:       purpose,
		Justification: justification,
		Duration:      duration,
		Metadata:      make(map[string]interface{}),
	}
	return cb
}

// WithRisk sets risk assessment information
func (cb *ContextBuilder) WithRisk(score float64, threatLevel string) *ContextBuilder {
	cb.context.RiskScore = score
	cb.context.ThreatLevel = threatLevel
	return cb
}

// WithConstraint adds a constraint
func (cb *ContextBuilder) WithConstraint(key string, value interface{}) *ContextBuilder {
	cb.context.Constraints[key] = value
	return cb
}

// WithMetadata adds metadata
func (cb *ContextBuilder) WithMetadata(key string, value interface{}) *ContextBuilder {
	cb.context.Metadata[key] = value
	return cb
}

// Build creates the final context with computed fields
func (cb *ContextBuilder) Build() *Context {
	// Compute derived fields
	cb.computeDerivedFields()

	// Validate the context
	if err := cb.validate(); err != nil {
		log.Warn().Err(err).Msg("Context validation failed")
	}

	return cb.context
}

// computeDerivedFields computes fields derived from other context data
func (cb *ContextBuilder) computeDerivedFields() {
	// Compute time-based fields
	now := cb.context.Timestamp
	cb.context.TimeOfDay = getTimeOfDay(now)
	cb.context.DayOfWeek = now.Weekday().String()
	cb.context.BusinessHours = isBusinessHours(now)

	// Detect VPN if IP geolocation is available
	if cb.context.IPAddress != "" {
		cb.context.VPNDetected = detectVPN(cb.context.IPAddress)
	}

	// Compute risk score if not set
	if cb.context.RiskScore == 0 {
		cb.context.RiskScore = cb.computeRiskScore()
	}
}

// validate validates the context for completeness and consistency
func (cb *ContextBuilder) validate() error {
	ctx := cb.context

	if ctx.RequestID == "" {
		return fmt.Errorf("request ID is required")
	}

	if ctx.Operation == "" {
		return fmt.Errorf("operation is required")
	}

	if ctx.UserID == "" {
		return fmt.Errorf("user ID is required")
	}

	if ctx.IPAddress != "" {
		if net.ParseIP(ctx.IPAddress) == nil {
			return fmt.Errorf("invalid IP address: %s", ctx.IPAddress)
		}
	}

	return nil
}

// computeRiskScore computes a risk score based on context factors
func (cb *ContextBuilder) computeRiskScore() float64 {
	ctx := cb.context
	score := 0.0

	// Base score
	score += 1.0

	// Network factors
	if ctx.VPNDetected {
		score += 2.0
	}

	if ctx.NetworkZone == "external" {
		score += 1.5
	}

	// Authentication factors
	if !ctx.MFAVerified {
		score += 2.0
	}

	if ctx.AuthMethod == "password" {
		score += 1.0
	}

	// Device factors
	if !ctx.DeviceAttested {
		score += 1.5
	}

	if ctx.DeviceTrust == "untrusted" {
		score += 3.0
	}

	// Time factors
	if !ctx.BusinessHours {
		score += 1.0
	}

	// Session factors
	if ctx.SessionAge > 24*time.Hour {
		score += 1.0
	}

	// Normalize to 0-10 scale
	if score > 10.0 {
		score = 10.0
	}

	return score
}

// Helper functions

func getTimeOfDay(t time.Time) string {
	hour := t.Hour()

	switch {
	case hour >= 6 && hour < 12:
		return "morning"
	case hour >= 12 && hour < 18:
		return "afternoon"
	case hour >= 18 && hour < 22:
		return "evening"
	default:
		return "night"
	}
}

func isBusinessHours(t time.Time) bool {
	// Simple business hours: weekdays 9 AM to 5 PM
	weekday := t.Weekday()
	hour := t.Hour()

	return weekday >= time.Monday && weekday <= time.Friday && hour >= 9 && hour < 17
}

func detectVPN(ipAddress string) bool {
	// Simple VPN detection - in production, use a proper VPN detection service
	// For now, just return false
	_ = ipAddress // Will be used for VPN detection service integration in full implementation
	return false
}

// ContextExtractor extracts context from various sources
type ContextExtractor struct{}

// NewContextExtractor creates a new context extractor
func NewContextExtractor() *ContextExtractor {
	return &ContextExtractor{}
}

// ExtractFromHTTPRequest extracts context from an HTTP request
func (ce *ContextExtractor) ExtractFromHTTPRequest(requestData map[string]interface{}) (*Context, error) {
	builder := NewContextBuilder()

	// Extract basic request information
	if requestID, ok := requestData["request_id"].(string); ok {
		builder.WithRequestID(requestID)
	}

	if operation, ok := requestData["operation"].(string); ok {
		builder.WithOperation(operation)
	}

	// Extract user information
	if userID, ok := requestData["user_id"].(string); ok {
		roles := []string{}
		groups := []string{}

		if rolesData, ok := requestData["user_roles"].([]interface{}); ok {
			for _, role := range rolesData {
				if roleStr, ok := role.(string); ok {
					roles = append(roles, roleStr)
				}
			}
		}

		if groupsData, ok := requestData["user_groups"].([]interface{}); ok {
			for _, group := range groupsData {
				if groupStr, ok := group.(string); ok {
					groups = append(groups, groupStr)
				}
			}
		}

		builder.WithUser(userID, roles, groups)
	}

	// Extract network information
	if ipAddress, ok := requestData["ip_address"].(string); ok {
		_ = ipAddress // Will be used for geolocation and VPN detection in full implementation
		builder.WithNetwork(ipAddress, "", "", "")
	}
	if ipAddress, ok := requestData["ip_address"].(string); ok {
		country := ""
		city := ""
		zone := ""

		if countryData, ok := requestData["ip_country"].(string); ok {
			country = countryData
		}

		if cityData, ok := requestData["ip_city"].(string); ok {
			city = cityData
		}

		if zoneData, ok := requestData["network_zone"].(string); ok {
			zone = zoneData
		}

		builder.WithNetwork(ipAddress, country, city, zone)
	}

	// Extract device information
	if deviceID, ok := requestData["device_id"].(string); ok {
		deviceType := ""
		trustLevel := ""
		attested := false

		if deviceTypeData, ok := requestData["device_type"].(string); ok {
			deviceType = deviceTypeData
		}

		if trustData, ok := requestData["device_trust"].(string); ok {
			trustLevel = trustData
		}

		if attestedData, ok := requestData["device_attested"].(bool); ok {
			attested = attestedData
		}

		builder.WithDevice(deviceID, deviceType, trustLevel, attested)
	}

	return builder.Build(), nil
}

// SerializeContext serializes a context to JSON
func SerializeContext(ctx *Context) ([]byte, error) {
	return json.Marshal(ctx)
}

// DeserializeContext deserializes a context from JSON
func DeserializeContext(data []byte) (*Context, error) {
	var ctx Context
	if err := json.Unmarshal(data, &ctx); err != nil {
		return nil, fmt.Errorf("failed to deserialize context: %w", err)
	}
	return &ctx, nil
}

// CloneContext creates a deep copy of a context
func CloneContext(ctx *Context) *Context {
	data, err := SerializeContext(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to serialize context for cloning")
		return nil
	}

	cloned, err := DeserializeContext(data)
	if err != nil {
		log.Error().Err(err).Msg("Failed to deserialize cloned context")
		return nil
	}

	return cloned
}
