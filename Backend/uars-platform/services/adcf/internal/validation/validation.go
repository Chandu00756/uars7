// Package validation provides comprehensive input validation and sanitization for ADCF
// Implements military-grade validation with extensive security checks
package validation

import (
	"fmt"
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
)

// ValidationConfig holds validation configuration
type ValidationConfig struct {
	MaxStringLength   int               `json:"max_string_length"`
	MaxIntValue       int64             `json:"max_int_value"`
	MinIntValue       int64             `json:"min_int_value"`
	AllowedDomains    []string          `json:"allowed_domains"`
	BlockedIPs        []string          `json:"blocked_ips"`
	RequiredHeaders   []string          `json:"required_headers"`
	MaxUploadSize     int64             `json:"max_upload_size"`
	AllowedFileTypes  []string          `json:"allowed_file_types"`
	SanitizationRules map[string]string `json:"sanitization_rules"`
	CustomValidators  map[string]string `json:"custom_validators"`
}

// Validator provides comprehensive validation services
type Validator struct {
	config  *ValidationConfig
	metrics *ValidationMetrics
	regexes map[string]*regexp.Regexp
}

// ValidationMetrics tracks validation metrics
type ValidationMetrics struct {
	ValidationAttempts   prometheus.CounterVec
	ValidationSuccesses  prometheus.CounterVec
	ValidationFailures   prometheus.CounterVec
	SanitizationAttempts prometheus.CounterVec
	SecurityViolations   prometheus.CounterVec
	SQLInjectionBlocked  prometheus.CounterVec
	XSSBlocked           prometheus.CounterVec
	CSRFBlocked          prometheus.CounterVec
}

// ValidationResult represents the result of a validation operation
type ValidationResult struct {
	IsValid       bool                   `json:"is_valid"`
	Errors        []ValidationError      `json:"errors,omitempty"`
	Warnings      []string               `json:"warnings,omitempty"`
	SanitizedData map[string]interface{} `json:"sanitized_data,omitempty"`
	SecurityFlags []string               `json:"security_flags,omitempty"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field    string `json:"field"`
	Message  string `json:"message"`
	Code     string `json:"code"`
	Severity string `json:"severity"`
}

// ValidationRule represents a validation rule
type ValidationRule struct {
	Field           string   `json:"field"`
	Required        bool     `json:"required"`
	Type            string   `json:"type"`
	MinLength       int      `json:"min_length,omitempty"`
	MaxLength       int      `json:"max_length,omitempty"`
	Pattern         string   `json:"pattern,omitempty"`
	AllowedValues   []string `json:"allowed_values,omitempty"`
	CustomValidator string   `json:"custom_validator,omitempty"`
	Sanitize        bool     `json:"sanitize"`
	SecurityCheck   bool     `json:"security_check"`
}

// NewValidator creates a new validator instance
func NewValidator(config *ValidationConfig) *Validator {
	metrics := &ValidationMetrics{
		ValidationAttempts: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_validation_attempts_total",
				Help: "Total number of validation attempts",
			},
			[]string{"type", "field"},
		),
		ValidationSuccesses: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_validation_successes_total",
				Help: "Total number of successful validations",
			},
			[]string{"type", "field"},
		),
		ValidationFailures: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_validation_failures_total",
				Help: "Total number of validation failures",
			},
			[]string{"type", "field", "reason"},
		),
		SanitizationAttempts: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_sanitization_attempts_total",
				Help: "Total number of sanitization attempts",
			},
			[]string{"type", "field"},
		),
		SecurityViolations: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_security_violations_total",
				Help: "Total number of security violations detected",
			},
			[]string{"type", "severity"},
		),
		SQLInjectionBlocked: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_sql_injection_blocked_total",
				Help: "Total number of SQL injection attempts blocked",
			},
			[]string{"field", "pattern"},
		),
		XSSBlocked: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_xss_blocked_total",
				Help: "Total number of XSS attempts blocked",
			},
			[]string{"field", "pattern"},
		),
		CSRFBlocked: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_csrf_blocked_total",
				Help: "Total number of CSRF attempts blocked",
			},
			[]string{"source", "target"},
		),
	}

	// Compile common regex patterns
	regexes := map[string]*regexp.Regexp{
		"email":        regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`),
		"uuid":         regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`),
		"alphanumeric": regexp.MustCompile(`^[a-zA-Z0-9]+$`),
		"numeric":      regexp.MustCompile(`^[0-9]+$`),
		"username":     regexp.MustCompile(`^[a-zA-Z0-9_\-\.]{3,50}$`),
		"deviceid":     regexp.MustCompile(`^[a-zA-Z0-9\-]{8,64}$`),
		"ipv4":         regexp.MustCompile(`^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$`),
		"ipv6":         regexp.MustCompile(`^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$`),
		"url":          regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`),
		"jwt":          regexp.MustCompile(`^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$`),

		// Security patterns
		"sql_injection":     regexp.MustCompile(`(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_|--|\/\*|\*\/|'|"|\;|\||&|\$|%|@|#)`),
		"xss":               regexp.MustCompile(`(?i)(<script|<iframe|<object|<embed|<link|<meta|<style|javascript:|vbscript:|onload|onerror|onclick|onmouseover)`),
		"path_traversal":    regexp.MustCompile(`(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)`),
		"command_injection": regexp.MustCompile(`(;|\||&|\$\(|` + "```" + `|%0a|%0d|%3b|%7c|%26)`),
		"ldap_injection":    regexp.MustCompile(`(\*|\(|\)|\||&|!|=|<|>|~|%2a|%28|%29|%7c|%26|%21|%3d|%3c|%3e|%7e)`),
	}

	return &Validator{
		config:  config,
		metrics: metrics,
		regexes: regexes,
	}
}

// ValidateData validates data against a set of rules
func (v *Validator) ValidateData(data map[string]interface{}, rules []ValidationRule) *ValidationResult {
	result := &ValidationResult{
		IsValid:       true,
		Errors:        []ValidationError{},
		Warnings:      []string{},
		SanitizedData: make(map[string]interface{}),
		SecurityFlags: []string{},
	}

	for _, rule := range rules {
		v.metrics.ValidationAttempts.WithLabelValues(rule.Type, rule.Field).Inc()

		value, exists := data[rule.Field]

		// Check if required field is missing
		if rule.Required && !exists {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    rule.Field,
				Message:  fmt.Sprintf("Field %s is required", rule.Field),
				Code:     "REQUIRED_FIELD_MISSING",
				Severity: "error",
			})
			v.metrics.ValidationFailures.WithLabelValues(rule.Type, rule.Field, "required").Inc()
			continue
		}

		// Skip validation if field is not present and not required
		if !exists {
			continue
		}

		// Validate field type and value
		fieldResult := v.validateField(rule.Field, value, &rule)
		if !fieldResult.IsValid {
			result.IsValid = false
			result.Errors = append(result.Errors, fieldResult.Errors...)
		} else {
			v.metrics.ValidationSuccesses.WithLabelValues(rule.Type, rule.Field).Inc()
		}

		result.Warnings = append(result.Warnings, fieldResult.Warnings...)
		result.SecurityFlags = append(result.SecurityFlags, fieldResult.SecurityFlags...)

		// Add sanitized data
		if len(fieldResult.SanitizedData) > 0 {
			for k, v := range fieldResult.SanitizedData {
				result.SanitizedData[k] = v
			}
		} else {
			result.SanitizedData[rule.Field] = value
		}
	}

	return result
}

// validateField validates a single field
func (v *Validator) validateField(fieldName string, value interface{}, rule *ValidationRule) *ValidationResult {
	result := &ValidationResult{
		IsValid:       true,
		Errors:        []ValidationError{},
		Warnings:      []string{},
		SanitizedData: make(map[string]interface{}),
		SecurityFlags: []string{},
	}

	// Convert value to string for most validations
	strValue := fmt.Sprintf("%v", value)

	// Security checks first
	if rule.SecurityCheck {
		securityResult := v.performSecurityChecks(fieldName, strValue)
		if !securityResult.IsValid {
			result.IsValid = false
			result.Errors = append(result.Errors, securityResult.Errors...)
		}
		result.SecurityFlags = append(result.SecurityFlags, securityResult.SecurityFlags...)
	}

	// Type validation
	switch rule.Type {
	case "string":
		if err := v.validateString(strValue, rule); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_STRING",
				Severity: "error",
			})
		}
	case "email":
		if err := v.validateEmail(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_EMAIL",
				Severity: "error",
			})
		}
	case "int":
		if err := v.validateInt(strValue, rule); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_INTEGER",
				Severity: "error",
			})
		}
	case "uuid":
		if err := v.validateUUID(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_UUID",
				Severity: "error",
			})
		}
	case "ip":
		if err := v.validateIP(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_IP",
				Severity: "error",
			})
		}
	case "url":
		if err := v.validateURL(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_URL",
				Severity: "error",
			})
		}
	case "jwt":
		if err := v.validateJWT(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_JWT",
				Severity: "error",
			})
		}
	case "datetime":
		if err := v.validateDateTime(strValue); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  err.Error(),
				Code:     "INVALID_DATETIME",
				Severity: "error",
			})
		}
	}

	// Pattern validation
	if rule.Pattern != "" {
		pattern, err := regexp.Compile(rule.Pattern)
		if err != nil {
			result.Warnings = append(result.Warnings, fmt.Sprintf("Invalid regex pattern for field %s", fieldName))
		} else if !pattern.MatchString(strValue) {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  fmt.Sprintf("Field %s does not match required pattern", fieldName),
				Code:     "PATTERN_MISMATCH",
				Severity: "error",
			})
		}
	}

	// Allowed values validation
	if len(rule.AllowedValues) > 0 {
		allowed := false
		for _, allowedValue := range rule.AllowedValues {
			if strValue == allowedValue {
				allowed = true
				break
			}
		}
		if !allowed {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    fieldName,
				Message:  fmt.Sprintf("Field %s contains invalid value", fieldName),
				Code:     "INVALID_VALUE",
				Severity: "error",
			})
		}
	}

	// Sanitization
	if rule.Sanitize {
		v.metrics.SanitizationAttempts.WithLabelValues(rule.Type, fieldName).Inc()
		sanitizedValue := v.sanitizeValue(strValue, rule.Type)
		result.SanitizedData[fieldName] = sanitizedValue
	}

	return result
}

// performSecurityChecks performs security validation
func (v *Validator) performSecurityChecks(fieldName, value string) *ValidationResult {
	result := &ValidationResult{
		IsValid:       true,
		Errors:        []ValidationError{},
		SecurityFlags: []string{},
	}

	// SQL Injection detection
	if v.regexes["sql_injection"].MatchString(value) {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    fieldName,
			Message:  "Potential SQL injection detected",
			Code:     "SQL_INJECTION",
			Severity: "critical",
		})
		result.SecurityFlags = append(result.SecurityFlags, "SQL_INJECTION_DETECTED")
		v.metrics.SQLInjectionBlocked.WithLabelValues(fieldName, "generic").Inc()
		v.metrics.SecurityViolations.WithLabelValues("sql_injection", "critical").Inc()
	}

	// XSS detection
	if v.regexes["xss"].MatchString(value) {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    fieldName,
			Message:  "Potential XSS attack detected",
			Code:     "XSS_ATTACK",
			Severity: "critical",
		})
		result.SecurityFlags = append(result.SecurityFlags, "XSS_DETECTED")
		v.metrics.XSSBlocked.WithLabelValues(fieldName, "generic").Inc()
		v.metrics.SecurityViolations.WithLabelValues("xss", "critical").Inc()
	}

	// Path traversal detection
	if v.regexes["path_traversal"].MatchString(value) {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    fieldName,
			Message:  "Path traversal attack detected",
			Code:     "PATH_TRAVERSAL",
			Severity: "high",
		})
		result.SecurityFlags = append(result.SecurityFlags, "PATH_TRAVERSAL_DETECTED")
		v.metrics.SecurityViolations.WithLabelValues("path_traversal", "high").Inc()
	}

	// Command injection detection
	if v.regexes["command_injection"].MatchString(value) {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    fieldName,
			Message:  "Command injection attack detected",
			Code:     "COMMAND_INJECTION",
			Severity: "critical",
		})
		result.SecurityFlags = append(result.SecurityFlags, "COMMAND_INJECTION_DETECTED")
		v.metrics.SecurityViolations.WithLabelValues("command_injection", "critical").Inc()
	}

	// LDAP injection detection
	if v.regexes["ldap_injection"].MatchString(value) {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    fieldName,
			Message:  "LDAP injection attack detected",
			Code:     "LDAP_INJECTION",
			Severity: "high",
		})
		result.SecurityFlags = append(result.SecurityFlags, "LDAP_INJECTION_DETECTED")
		v.metrics.SecurityViolations.WithLabelValues("ldap_injection", "high").Inc()
	}

	return result
}

// String validation
func (v *Validator) validateString(value string, rule *ValidationRule) error {
	if len(value) > v.config.MaxStringLength {
		return fmt.Errorf("string exceeds maximum length of %d", v.config.MaxStringLength)
	}

	if rule.MinLength > 0 && len(value) < rule.MinLength {
		return fmt.Errorf("string is shorter than minimum length of %d", rule.MinLength)
	}

	if rule.MaxLength > 0 && len(value) > rule.MaxLength {
		return fmt.Errorf("string exceeds maximum length of %d", rule.MaxLength)
	}

	return nil
}

// Email validation
func (v *Validator) validateEmail(email string) error {
	if !v.regexes["email"].MatchString(email) {
		return fmt.Errorf("invalid email format")
	}

	// Additional validation using net/mail
	_, err := mail.ParseAddress(email)
	if err != nil {
		return fmt.Errorf("invalid email address: %w", err)
	}

	// Check against allowed domains if configured
	if len(v.config.AllowedDomains) > 0 {
		parts := strings.Split(email, "@")
		if len(parts) != 2 {
			return fmt.Errorf("invalid email format")
		}

		domain := parts[1]
		allowed := false
		for _, allowedDomain := range v.config.AllowedDomains {
			if domain == allowedDomain {
				allowed = true
				break
			}
		}

		if !allowed {
			return fmt.Errorf("email domain not allowed")
		}
	}

	return nil
}

// Integer validation
func (v *Validator) validateInt(value string, rule *ValidationRule) error {
	intValue, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid integer format")
	}

	if intValue < v.config.MinIntValue {
		return fmt.Errorf("integer value too small")
	}

	if intValue > v.config.MaxIntValue {
		return fmt.Errorf("integer value too large")
	}

	return nil
}

// UUID validation
func (v *Validator) validateUUID(uuid string) error {
	if !v.regexes["uuid"].MatchString(strings.ToLower(uuid)) {
		return fmt.Errorf("invalid UUID format")
	}
	return nil
}

// IP address validation
func (v *Validator) validateIP(ip string) error {
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		return fmt.Errorf("invalid IP address format")
	}

	// Check against blocked IPs
	for _, blockedIP := range v.config.BlockedIPs {
		if ip == blockedIP {
			return fmt.Errorf("IP address is blocked")
		}
	}

	return nil
}

// URL validation
func (v *Validator) validateURL(urlString string) error {
	if !v.regexes["url"].MatchString(urlString) {
		return fmt.Errorf("invalid URL format")
	}

	parsedURL, err := url.Parse(urlString)
	if err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	// Only allow HTTPS URLs for security
	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS URLs are allowed")
	}

	return nil
}

// JWT validation (format only)
func (v *Validator) validateJWT(token string) error {
	if !v.regexes["jwt"].MatchString(token) {
		return fmt.Errorf("invalid JWT format")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return fmt.Errorf("JWT must have exactly 3 parts")
	}

	return nil
}

// DateTime validation
func (v *Validator) validateDateTime(datetime string) error {
	formats := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, format := range formats {
		if _, err := time.Parse(format, datetime); err == nil {
			return nil
		}
	}

	return fmt.Errorf("invalid datetime format")
}

// sanitizeValue sanitizes a value based on its type
func (v *Validator) sanitizeValue(value, valueType string) string {
	switch valueType {
	case "string":
		return v.sanitizeString(value)
	case "email":
		return strings.ToLower(strings.TrimSpace(value))
	case "url":
		return strings.TrimSpace(value)
	default:
		return strings.TrimSpace(value)
	}
}

// sanitizeString performs comprehensive string sanitization
func (v *Validator) sanitizeString(input string) string {
	// Remove null bytes
	input = strings.ReplaceAll(input, "\x00", "")

	// Remove control characters except tab, newline, and carriage return
	var sanitized strings.Builder
	for _, r := range input {
		if unicode.IsControl(r) && r != '\t' && r != '\n' && r != '\r' {
			continue
		}
		sanitized.WriteRune(r)
	}

	// Trim whitespace
	result := strings.TrimSpace(sanitized.String())

	// Apply custom sanitization rules
	for pattern, replacement := range v.config.SanitizationRules {
		re, err := regexp.Compile(pattern)
		if err != nil {
			log.Warn().Str("pattern", pattern).Err(err).Msg("Invalid sanitization regex")
			continue
		}
		result = re.ReplaceAllString(result, replacement)
	}

	return result
}

// ValidateHeaders validates HTTP headers
func (v *Validator) ValidateHeaders(headers map[string][]string) *ValidationResult {
	result := &ValidationResult{
		IsValid:       true,
		Errors:        []ValidationError{},
		Warnings:      []string{},
		SecurityFlags: []string{},
	}

	// Check required headers
	for _, required := range v.config.RequiredHeaders {
		if _, exists := headers[required]; !exists {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    required,
				Message:  fmt.Sprintf("Required header %s is missing", required),
				Code:     "MISSING_HEADER",
				Severity: "error",
			})
		}
	}

	// Validate specific headers
	for _, values := range headers {
		for _, value := range values {
			// Security checks for headers
			if v.regexes["xss"].MatchString(value) {
				result.SecurityFlags = append(result.SecurityFlags, "XSS_IN_HEADER")
				v.metrics.SecurityViolations.WithLabelValues("xss_header", "medium").Inc()
			}

			if v.regexes["sql_injection"].MatchString(value) {
				result.SecurityFlags = append(result.SecurityFlags, "SQL_INJECTION_IN_HEADER")
				v.metrics.SecurityViolations.WithLabelValues("sql_injection_header", "medium").Inc()
			}
		}
	}

	return result
}

// ValidateFileUpload validates file uploads
func (v *Validator) ValidateFileUpload(filename string, fileSize int64, contentType string) *ValidationResult {
	result := &ValidationResult{
		IsValid:       true,
		Errors:        []ValidationError{},
		Warnings:      []string{},
		SecurityFlags: []string{},
	}

	// Check file size
	if fileSize > v.config.MaxUploadSize {
		result.IsValid = false
		result.Errors = append(result.Errors, ValidationError{
			Field:    "file_size",
			Message:  fmt.Sprintf("File size exceeds maximum allowed size of %d bytes", v.config.MaxUploadSize),
			Code:     "FILE_TOO_LARGE",
			Severity: "error",
		})
	}

	// Check file extension
	ext := strings.ToLower(strings.TrimPrefix(strings.ToLower(filename), "."))
	if len(v.config.AllowedFileTypes) > 0 {
		allowed := false
		for _, allowedType := range v.config.AllowedFileTypes {
			if ext == allowedType {
				allowed = true
				break
			}
		}

		if !allowed {
			result.IsValid = false
			result.Errors = append(result.Errors, ValidationError{
				Field:    "file_type",
				Message:  fmt.Sprintf("File type %s is not allowed", ext),
				Code:     "INVALID_FILE_TYPE",
				Severity: "error",
			})
		}
	}

	// Security checks for filename
	securityResult := v.performSecurityChecks("filename", filename)
	if !securityResult.IsValid {
		result.IsValid = false
		result.Errors = append(result.Errors, securityResult.Errors...)
	}
	result.SecurityFlags = append(result.SecurityFlags, securityResult.SecurityFlags...)

	return result
}

// GetValidationMetrics returns validation metrics for Prometheus
func (v *Validator) GetValidationMetrics() []prometheus.Collector {
	return []prometheus.Collector{
		&v.metrics.ValidationAttempts,
		&v.metrics.ValidationSuccesses,
		&v.metrics.ValidationFailures,
		&v.metrics.SanitizationAttempts,
		&v.metrics.SecurityViolations,
		&v.metrics.SQLInjectionBlocked,
		&v.metrics.XSSBlocked,
		&v.metrics.CSRFBlocked,
	}
}

// Common validation rules for ADCF
var (
	LoginValidationRules = []ValidationRule{
		{
			Field:         "username",
			Required:      true,
			Type:          "string",
			MinLength:     3,
			MaxLength:     50,
			Pattern:       "^[a-zA-Z0-9_\\-\\.]+$",
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "password",
			Required:      true,
			Type:          "string",
			MinLength:     8,
			MaxLength:     128,
			SecurityCheck: true,
		},
		{
			Field:         "device_id",
			Required:      true,
			Type:          "string",
			Pattern:       "^[a-zA-Z0-9\\-]{8,64}$",
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "totp_code",
			Required:      false,
			Type:          "string",
			Pattern:       "^[0-9]{6}$",
			SecurityCheck: true,
		},
	}

	UserRegistrationRules = []ValidationRule{
		{
			Field:         "username",
			Required:      true,
			Type:          "string",
			MinLength:     3,
			MaxLength:     50,
			Pattern:       "^[a-zA-Z0-9_\\-\\.]+$",
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "email",
			Required:      true,
			Type:          "email",
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "password",
			Required:      true,
			Type:          "string",
			MinLength:     8,
			MaxLength:     128,
			SecurityCheck: true,
		},
		{
			Field:         "confirm_password",
			Required:      true,
			Type:          "string",
			MinLength:     8,
			MaxLength:     128,
			SecurityCheck: true,
		},
	}

	CapsuleValidationRules = []ValidationRule{
		{
			Field:         "capsule_id",
			Required:      true,
			Type:          "uuid",
			SecurityCheck: true,
		},
		{
			Field:         "name",
			Required:      true,
			Type:          "string",
			MinLength:     1,
			MaxLength:     100,
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "description",
			Required:      false,
			Type:          "string",
			MaxLength:     1000,
			Sanitize:      true,
			SecurityCheck: true,
		},
		{
			Field:         "data",
			Required:      true,
			Type:          "string",
			SecurityCheck: true,
		},
	}
)
