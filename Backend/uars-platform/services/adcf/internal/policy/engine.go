package policy

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"time"
)

// WasmPolicyEngine is an interface to WASM policy execution (e.g., Wasmtime)
type WasmPolicyEngine interface {
	EvaluatePolicyWASM(ctx *PolicyContext, policy []byte, fuel uint64) (bool, error)
}

// Engine represents the policy evaluation engine
type Engine struct {
	rules      []PolicyRule
	mutex      sync.RWMutex
	wasmEngine WasmPolicyEngine
}

// PolicyContext represents the context for policy evaluation
type PolicyContext struct {
	Purpose         string                 `json:"purpose"`
	GeoLocation     string                 `json:"geo"`
	Timestamp       time.Time              `json:"timestamp"`
	IPAddress       string                 `json:"ip_address"`
	UserAgent       string                 `json:"user_agent"`
	DataType        string                 `json:"data_type"`
	DataSize        int64                  `json:"data_size"`
	EncryptionKey   string                 `json:"encryption_key"`
	Attributes      map[string]interface{} `json:"attributes"`
	IntentToken     string                 `json:"intent_token"`     // Ed25519-signed, ZKP-attested
	IntentSignature string                 `json:"intent_signature"` // Ed25519 signature
	ZKPProof        string                 `json:"zkp_proof"`        // ZKP attestation
	FuelCap         uint64                 `json:"fuel_cap"`         // WASM fuel cap for policy evaluation
}

// PolicyRule represents a single policy rule
type PolicyRule struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Conditions  []PolicyCondition      `json:"conditions"`
	Actions     []PolicyAction         `json:"actions"`
	Priority    int                    `json:"priority"`
	Enabled     bool                   `json:"enabled"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// PolicyCondition defines when a rule applies
type PolicyCondition struct {
	Type     string                 `json:"type"`
	Field    string                 `json:"field"`
	Operator string                 `json:"operator"`
	Value    interface{}            `json:"value"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// PolicyAction defines what happens when a rule matches
type PolicyAction struct {
	Type     string                 `json:"type"`
	Decision string                 `json:"decision"` // allow, deny, require
	Message  string                 `json:"message,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// PolicyResult represents the result of policy evaluation
type PolicyResult struct {
	Decision    string                 `json:"decision"`
	Message     string                 `json:"message,omitempty"`
	MatchedRule string                 `json:"matched_rule,omitempty"`
	Context     *PolicyContext         `json:"context,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// NewEngine creates a new policy engine
func NewEngine() *Engine {
	return &Engine{
		rules: make([]PolicyRule, 0),
	}
}

// LoadPolicy loads a policy from JSON
func (e *Engine) LoadPolicy(policyJSON []byte) error {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	var rule PolicyRule
	if err := json.Unmarshal(policyJSON, &rule); err != nil {
		return fmt.Errorf("failed to parse policy: %w", err)
	}

	// Validate rule
	if rule.ID == "" {
		return fmt.Errorf("policy rule must have an ID")
	}

	// Replace existing rule or add new one
	for i, existingRule := range e.rules {
		if existingRule.ID == rule.ID {
			e.rules[i] = rule
			return nil
		}
	}

	e.rules = append(e.rules, rule)
	return nil
}

// SetWasmEngine allows plugging in a WASM policy engine
func (e *Engine) SetWasmEngine(wasmEngine WasmPolicyEngine) {
	e.wasmEngine = wasmEngine
}

// EvaluatePolicy evaluates a policy against the given context
func (e *Engine) EvaluatePolicy(ctx context.Context, policyCtx *PolicyContext) (*PolicyResult, error) {
	e.mutex.RLock()
	defer e.mutex.RUnlock()

	// Default result is allow
	result := &PolicyResult{
		Decision: "allow",
		Message:  "No matching policy rules",
		Context:  policyCtx,
		Metadata: make(map[string]interface{}),
	}

	// 1. Verify intent token (Ed25519 signature, ZKP attestation)
	if policyCtx.IntentToken != "" && policyCtx.IntentSignature != "" {
		if !verifyEd25519Signature(policyCtx.IntentToken, policyCtx.IntentSignature) {
			return nil, fmt.Errorf("invalid intent token signature")
		}
	}
	if policyCtx.ZKPProof != "" {
		if !verifyZKP(policyCtx.IntentToken, policyCtx.ZKPProof) {
			return nil, fmt.Errorf("invalid ZKP proof for intent token")
		}
	}

	// 2. WASM policy evaluation (if engine is set)
	if e.wasmEngine != nil {
		for _, rule := range e.rules {
			if !rule.Enabled {
				continue
			}
			// Marshal rule to JSON for WASM
			ruleJSON, err := json.Marshal(rule)
			if err != nil {
				return nil, fmt.Errorf("failed to marshal rule for WASM: %w", err)
			}
			fuel := policyCtx.FuelCap
			if fuel == 0 {
				fuel = 50000 // default fuel cap
			}
			matched, err := e.wasmEngine.EvaluatePolicyWASM(policyCtx, ruleJSON, fuel)
			if err != nil {
				return nil, fmt.Errorf("WASM policy evaluation failed: %w", err)
			}
			if matched {
				for _, action := range rule.Actions {
					result.Decision = action.Decision
					result.Message = action.Message
					result.MatchedRule = rule.ID
					for k, v := range action.Metadata {
						result.Metadata[k] = v
					}
				}
				break
			}
		}
	} else {
		// Fallback to Go policy evaluation
		for _, rule := range e.rules {
			if !rule.Enabled {
				continue
			}
			matched, err := e.evaluateRule(rule, policyCtx)
			if err != nil {
				return nil, fmt.Errorf("failed to evaluate rule %s: %w", rule.ID, err)
			}
			if matched {
				for _, action := range rule.Actions {
					result.Decision = action.Decision
					result.Message = action.Message
					result.MatchedRule = rule.ID
					for k, v := range action.Metadata {
						result.Metadata[k] = v
					}
				}
				break
			}
		}
	}

	return result, nil
}

// verifyEd25519Signature verifies an Ed25519 signature for the intent token
func verifyEd25519Signature(token string, signature string) bool {
	// TODO: Implement Ed25519 signature verification
	// Use golang.org/x/crypto/ed25519
	_ = signature // Will be used for cryptographic verification in full implementation
	_ = token     // Will be used as the message to verify
	return true   // stub
}

// verifyZKP verifies a ZKP attestation for the intent token
func verifyZKP(token string, zkpProof string) bool {
	// TODO: Implement ZKP verification logic
	_ = zkpProof // Will be used for zero-knowledge proof verification
	_ = token    // Will be used as the statement to verify
	return true  // stub
}

// evaluateRule evaluates a single rule against the context
func (e *Engine) evaluateRule(rule PolicyRule, ctx *PolicyContext) (bool, error) {
	if len(rule.Conditions) == 0 {
		return true, nil // No conditions means always match
	}

	// All conditions must match (AND logic)
	for _, condition := range rule.Conditions {
		matched, err := e.evaluateCondition(condition, ctx)
		if err != nil {
			return false, err
		}
		if !matched {
			return false, nil
		}
	}

	return true, nil
}

// evaluateCondition evaluates a single condition
func (e *Engine) evaluateCondition(condition PolicyCondition, ctx *PolicyContext) (bool, error) {
	var fieldValue interface{}

	// Get field value from context
	switch condition.Field {
	case "purpose":
		fieldValue = ctx.Purpose
	case "geo":
		fieldValue = ctx.GeoLocation
	case "timestamp":
		fieldValue = ctx.Timestamp
	case "ip_address":
		fieldValue = ctx.IPAddress
	case "user_agent":
		fieldValue = ctx.UserAgent
	case "data_type":
		fieldValue = ctx.DataType
	case "data_size":
		fieldValue = ctx.DataSize
	default:
		// Check attributes
		if ctx.Attributes != nil {
			if val, exists := ctx.Attributes[condition.Field]; exists {
				fieldValue = val
			}
		}
	}

	// Evaluate operator
	switch condition.Operator {
	case "equals", "eq":
		return reflect.DeepEqual(fieldValue, condition.Value), nil
	case "not_equals", "ne":
		return !reflect.DeepEqual(fieldValue, condition.Value), nil
	case "contains":
		fieldStr, ok := fieldValue.(string)
		if !ok {
			return false, nil
		}
		valueStr, ok := condition.Value.(string)
		if !ok {
			return false, nil
		}
		return strings.Contains(fieldStr, valueStr), nil
	case "starts_with":
		fieldStr, ok := fieldValue.(string)
		if !ok {
			return false, nil
		}
		valueStr, ok := condition.Value.(string)
		if !ok {
			return false, nil
		}
		return strings.HasPrefix(fieldStr, valueStr), nil
	case "ends_with":
		fieldStr, ok := fieldValue.(string)
		if !ok {
			return false, nil
		}
		valueStr, ok := condition.Value.(string)
		if !ok {
			return false, nil
		}
		return strings.HasSuffix(fieldStr, valueStr), nil
	case "greater_than", "gt":
		return compareNumbers(fieldValue, condition.Value, func(a, b float64) bool { return a > b })
	case "greater_equal", "gte":
		return compareNumbers(fieldValue, condition.Value, func(a, b float64) bool { return a >= b })
	case "less_than", "lt":
		return compareNumbers(fieldValue, condition.Value, func(a, b float64) bool { return a < b })
	case "less_equal", "lte":
		return compareNumbers(fieldValue, condition.Value, func(a, b float64) bool { return a <= b })
	case "in":
		valueSlice, ok := condition.Value.([]interface{})
		if !ok {
			return false, nil
		}
		for _, v := range valueSlice {
			if reflect.DeepEqual(fieldValue, v) {
				return true, nil
			}
		}
		return false, nil
	case "not_in":
		valueSlice, ok := condition.Value.([]interface{})
		if !ok {
			return false, nil
		}
		for _, v := range valueSlice {
			if reflect.DeepEqual(fieldValue, v) {
				return false, nil
			}
		}
		return true, nil
	case "regex":
		// TODO: Implement regex matching if needed
		return false, fmt.Errorf("regex operator not implemented")
	default:
		return false, fmt.Errorf("unknown operator: %s", condition.Operator)
	}
}

// compareNumbers compares two values as numbers
func compareNumbers(a, b interface{}, compare func(float64, float64) bool) (bool, error) {
	aFloat, aOk := toFloat64(a)
	bFloat, bOk := toFloat64(b)

	if !aOk || !bOk {
		return false, fmt.Errorf("cannot compare non-numeric values")
	}

	return compare(aFloat, bFloat), nil
}

// toFloat64 converts various numeric types to float64
func toFloat64(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int32:
		return float64(val), true
	case int64:
		return float64(val), true
	case uint:
		return float64(val), true
	case uint32:
		return float64(val), true
	case uint64:
		return float64(val), true
	default:
		return 0, false
	}
}

// ListRules returns all loaded rules
func (e *Engine) ListRules() []PolicyRule {
	e.mutex.RLock()
	defer e.mutex.RUnlock()

	rules := make([]PolicyRule, len(e.rules))
	copy(rules, e.rules)
	return rules
}

// RemoveRule removes a rule by ID
func (e *Engine) RemoveRule(ruleID string) error {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	for i, rule := range e.rules {
		if rule.ID == ruleID {
			e.rules = append(e.rules[:i], e.rules[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("rule with ID %s not found", ruleID)
}

// ClearRules removes all rules
func (e *Engine) ClearRules() {
	e.mutex.Lock()
	defer e.mutex.Unlock()

	e.rules = e.rules[:0]
}

// CreateDefaultPolicies creates some default policies for testing
func (e *Engine) CreateDefaultPolicies() error {
	// Default allow policy
	allowPolicy := PolicyRule{
		ID:          "default-allow",
		Name:        "Default Allow",
		Description: "Default policy that allows all actions",
		Conditions:  []PolicyCondition{},
		Actions: []PolicyAction{
			{
				Type:     "access",
				Decision: "allow",
				Message:  "Access granted by default policy",
			},
		},
		Priority: 1000,
		Enabled:  true,
	}

	// Geo-restriction policy
	geoPolicy := PolicyRule{
		ID:          "geo-restriction",
		Name:        "Geographic Restriction",
		Description: "Deny access from restricted countries",
		Conditions: []PolicyCondition{
			{
				Type:     "geo",
				Field:    "geo",
				Operator: "in",
				Value:    []interface{}{"CN", "RU", "IR"},
			},
		},
		Actions: []PolicyAction{
			{
				Type:     "access",
				Decision: "deny",
				Message:  "Access denied due to geographic restrictions",
			},
		},
		Priority: 10,
		Enabled:  true,
	}

	// Data size limit policy
	sizePolicy := PolicyRule{
		ID:          "size-limit",
		Name:        "Data Size Limit",
		Description: "Deny access to large data",
		Conditions: []PolicyCondition{
			{
				Type:     "size",
				Field:    "data_size",
				Operator: "greater_than",
				Value:    1000000, // 1MB
			},
		},
		Actions: []PolicyAction{
			{
				Type:     "access",
				Decision: "deny",
				Message:  "Data size exceeds maximum allowed limit",
			},
		},
		Priority: 20,
		Enabled:  false, // Disabled by default
	}

	policies := []PolicyRule{allowPolicy, geoPolicy, sizePolicy}

	for _, policy := range policies {
		policyJSON, err := json.Marshal(policy)
		if err != nil {
			return fmt.Errorf("failed to marshal policy %s: %w", policy.ID, err)
		}

		if err := e.LoadPolicy(policyJSON); err != nil {
			return fmt.Errorf("failed to load policy %s: %w", policy.ID, err)
		}
	}

	return nil
}
