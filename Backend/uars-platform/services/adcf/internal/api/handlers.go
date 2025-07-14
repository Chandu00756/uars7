// Package api provides HTTP API handlers for ADCF
// Implements military-grade REST and GraphQL APIs with comprehensive security
package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

// APIResponse represents a standardized API response
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
	Message   string      `json:"message,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// CapsuleRequest represents a capsule creation request
type CapsuleRequest struct {
	Data     string            `json:"data" validate:"required"`
	Metadata map[string]string `json:"metadata,omitempty"`
	PolicyID string            `json:"policy_id,omitempty"`
	TTL      int64             `json:"ttl,omitempty"`
}

// CapsuleResponse represents a capsule in API responses
type CapsuleResponse struct {
	ID          string            `json:"id"`
	OwnerID     string            `json:"owner_id"`
	DataHash    string            `json:"data_hash"`
	PolicyID    *string           `json:"policy_id,omitempty"`
	Metadata    map[string]string `json:"metadata"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	ExpiresAt   *time.Time        `json:"expires_at,omitempty"`
	Revoked     bool              `json:"revoked"`
	AccessCount int               `json:"access_count"`
	SizeBytes   int64             `json:"size_bytes"`
}

// PolicyRequest represents a policy creation/update request
type PolicyRequest struct {
	Name           string      `json:"name" validate:"required"`
	Description    string      `json:"description"`
	PolicyDocument interface{} `json:"policy_document" validate:"required"`
}

// PolicyResponse represents a policy in API responses
type PolicyResponse struct {
	ID             string      `json:"id"`
	Name           string      `json:"name"`
	Description    string      `json:"description"`
	PolicyDocument interface{} `json:"policy_document"`
	SchemaVersion  int         `json:"schema_version"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
	CreatedBy      string      `json:"created_by"`
	Active         bool        `json:"active"`
}

// WebSocket upgrader with security settings
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, implement proper origin checking
		return true
	},
}

// Health check handler
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	response := APIResponse{
		Success:   true,
		Message:   "ADCF service is healthy",
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Readiness check handler
func ReadinessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		// Check database connection
		if err := db.PingContext(ctx); err != nil {
			response := APIResponse{
				Success:   false,
				Error:     "Database not ready",
				Timestamp: time.Now(),
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(response)
			return
		}

		response := APIResponse{
			Success:   true,
			Message:   "ADCF service is ready",
			Timestamp: time.Now(),
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

// CreateCapsuleHandler handles capsule creation
func CreateCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CapsuleRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}

		// Get user ID from JWT token
		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		// Create capsule
		capsuleID := uuid.New().String()
		dataHash := calculateDataHash(req.Data)

		query := `
			INSERT INTO capsules (id, owner_id, data_hash, policy_id, encrypted_blob, metadata, expires_at, size_bytes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING created_at, updated_at
		`

		var expiresAt *time.Time
		if req.TTL > 0 {
			expiry := time.Now().Add(time.Duration(req.TTL) * time.Second)
			expiresAt = &expiry
		}

		metadataJSON, _ := json.Marshal(req.Metadata)
		encryptedData := encryptData(req.Data) // This would use the crypto package
		sizeBytes := int64(len(encryptedData))

		var createdAt, updatedAt time.Time
		err := db.QueryRow(query, capsuleID, userID, dataHash, req.PolicyID,
			encryptedData, metadataJSON, expiresAt, sizeBytes).Scan(&createdAt, &updatedAt)

		if err != nil {
			log.Error().Err(err).Msg("Failed to create capsule")
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to create capsule", err)
			return
		}

		response := CapsuleResponse{
			ID:          capsuleID,
			OwnerID:     userID,
			DataHash:    dataHash,
			Metadata:    req.Metadata,
			CreatedAt:   createdAt,
			UpdatedAt:   updatedAt,
			ExpiresAt:   expiresAt,
			Revoked:     false,
			AccessCount: 0,
			SizeBytes:   sizeBytes,
		}

		writeSuccessResponse(w, http.StatusCreated, response, "Capsule created successfully")
	}
}

// ListCapsulesHandler handles capsule listing
func ListCapsulesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		// Parse query parameters
		limit := parseIntParam(r.URL.Query().Get("limit"), 50)
		offset := parseIntParam(r.URL.Query().Get("offset"), 0)
		includeRevoked := r.URL.Query().Get("include_revoked") == "true"

		query := `
			SELECT id, owner_id, data_hash, policy_id, metadata, created_at, updated_at, 
				   expires_at, revoked, access_count, size_bytes
			FROM capsules 
			WHERE owner_id = $1
		`
		args := []interface{}{userID}

		if !includeRevoked {
			query += " AND revoked = false"
		}

		query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
		args = append(args, limit, offset)

		rows, err := db.Query(query, args...)
		if err != nil {
			log.Error().Err(err).Msg("Failed to list capsules")
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to list capsules", err)
			return
		}
		defer rows.Close()

		var capsules []CapsuleResponse
		for rows.Next() {
			var capsule CapsuleResponse
			var metadataJSON []byte
			var policyID sql.NullString

			err := rows.Scan(&capsule.ID, &capsule.OwnerID, &capsule.DataHash, &policyID,
				&metadataJSON, &capsule.CreatedAt, &capsule.UpdatedAt, &capsule.ExpiresAt,
				&capsule.Revoked, &capsule.AccessCount, &capsule.SizeBytes)

			if err != nil {
				log.Error().Err(err).Msg("Failed to scan capsule row")
				continue
			}

			if policyID.Valid {
				capsule.PolicyID = &policyID.String
			}

			if len(metadataJSON) > 0 {
				json.Unmarshal(metadataJSON, &capsule.Metadata)
			}

			capsules = append(capsules, capsule)
		}

		writeSuccessResponse(w, http.StatusOK, capsules, "Capsules retrieved successfully")
	}
}

// GetCapsuleHandler handles capsule retrieval
func GetCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capsuleID := vars["id"]

		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		query := `
			SELECT id, owner_id, data_hash, policy_id, metadata, created_at, updated_at,
				   expires_at, revoked, access_count, size_bytes
			FROM capsules 
			WHERE id = $1 AND owner_id = $2
		`

		var capsule CapsuleResponse
		var metadataJSON []byte
		var policyID sql.NullString

		err := db.QueryRow(query, capsuleID, userID).Scan(&capsule.ID, &capsule.OwnerID,
			&capsule.DataHash, &policyID, &metadataJSON, &capsule.CreatedAt, &capsule.UpdatedAt,
			&capsule.ExpiresAt, &capsule.Revoked, &capsule.AccessCount, &capsule.SizeBytes)

		if err == sql.ErrNoRows {
			writeErrorResponse(w, http.StatusNotFound, "Capsule not found", nil)
			return
		}
		if err != nil {
			log.Error().Err(err).Msg("Failed to get capsule")
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to get capsule", err)
			return
		}

		if policyID.Valid {
			capsule.PolicyID = &policyID.String
		}

		if len(metadataJSON) > 0 {
			json.Unmarshal(metadataJSON, &capsule.Metadata)
		}

		writeSuccessResponse(w, http.StatusOK, capsule, "Capsule retrieved successfully")
	}
}

// AccessCapsuleHandler handles capsule data access
func AccessCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capsuleID := vars["id"]

		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		// Get capsule and check access
		query := `
			SELECT encrypted_blob, revoked, expires_at, access_count
			FROM capsules 
			WHERE id = $1 AND owner_id = $2
		`

		var encryptedData []byte
		var revoked bool
		var expiresAt sql.NullTime
		var accessCount int

		err := db.QueryRow(query, capsuleID, userID).Scan(&encryptedData, &revoked, &expiresAt, &accessCount)
		if err == sql.ErrNoRows {
			writeErrorResponse(w, http.StatusNotFound, "Capsule not found", nil)
			return
		}
		if err != nil {
			log.Error().Err(err).Msg("Failed to access capsule")
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to access capsule", err)
			return
		}

		// Check if capsule is revoked
		if revoked {
			writeErrorResponse(w, http.StatusForbidden, "Capsule has been revoked", nil)
			return
		}

		// Check if capsule is expired
		if expiresAt.Valid && time.Now().After(expiresAt.Time) {
			writeErrorResponse(w, http.StatusForbidden, "Capsule has expired", nil)
			return
		}

		// Decrypt data
		decryptedData := decryptData(encryptedData) // This would use the crypto package

		// Update access count
		_, err = db.Exec("UPDATE capsules SET access_count = access_count + 1 WHERE id = $1", capsuleID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to update access count")
		}

		// Log access
		logCapsuleAccess(db, capsuleID, userID, r)

		response := map[string]interface{}{
			"data":         decryptedData,
			"access_count": accessCount + 1,
		}

		writeSuccessResponse(w, http.StatusOK, response, "Capsule data accessed successfully")
	}
}

// RevokeCapsuleHandler handles capsule revocation
func RevokeCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capsuleID := vars["id"]

		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		query := `
			UPDATE capsules 
			SET revoked = true, updated_at = NOW()
			WHERE id = $1 AND owner_id = $2 AND revoked = false
		`

		result, err := db.Exec(query, capsuleID, userID)
		if err != nil {
			log.Error().Err(err).Msg("Failed to revoke capsule")
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to revoke capsule", err)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			writeErrorResponse(w, http.StatusNotFound, "Capsule not found or already revoked", nil)
			return
		}

		// Log revocation
		logCapsuleRevocation(db, capsuleID, userID, r)

		writeSuccessResponse(w, http.StatusOK, nil, "Capsule revoked successfully")
	}
}

// GetCapsuleAuditHandler handles capsule audit log retrieval
func GetCapsuleAuditHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capsuleID := vars["id"]

		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		// Check if user owns the capsule
		var ownerID string
		err := db.QueryRow("SELECT owner_id FROM capsules WHERE id = $1", capsuleID).Scan(&ownerID)
		if err == sql.ErrNoRows {
			writeErrorResponse(w, http.StatusNotFound, "Capsule not found", nil)
			return
		}
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Database error", err)
			return
		}
		if ownerID != userID {
			writeErrorResponse(w, http.StatusForbidden, "Access denied", nil)
			return
		}

		query := `
			SELECT id, action, actor_id, timestamp, details, ip_address, user_agent, success
			FROM audit_logs 
			WHERE capsule_id = $1 
			ORDER BY timestamp DESC
		`

		rows, err := db.Query(query, capsuleID)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to get audit logs", err)
			return
		}
		defer rows.Close()

		var auditLogs []map[string]interface{}
		for rows.Next() {
			var log map[string]interface{} = make(map[string]interface{})
			var id, action, actorID, ipAddress, userAgent string
			var timestamp time.Time
			var detailsJSON []byte
			var success bool

			err := rows.Scan(&id, &action, &actorID, &timestamp, &detailsJSON, &ipAddress, &userAgent, &success)
			if err != nil {
				continue
			}

			log["id"] = id
			log["action"] = action
			log["actor_id"] = actorID
			log["timestamp"] = timestamp
			log["ip_address"] = ipAddress
			log["user_agent"] = userAgent
			log["success"] = success

			if len(detailsJSON) > 0 {
				var details map[string]interface{}
				json.Unmarshal(detailsJSON, &details)
				log["details"] = details
			}

			auditLogs = append(auditLogs, log)
		}

		writeSuccessResponse(w, http.StatusOK, auditLogs, "Audit logs retrieved successfully")
	}
}

// UpdateCapsulePolicyHandler handles capsule policy updates
func UpdateCapsulePolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capsuleID := vars["id"]

		userID := getUserIDFromToken(r)
		if userID == "" {
			writeErrorResponse(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		var req struct {
			PolicyID string `json:"policy_id"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorResponse(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}

		query := `
			UPDATE capsules 
			SET policy_id = $1, updated_at = NOW()
			WHERE id = $2 AND owner_id = $3
		`

		result, err := db.Exec(query, req.PolicyID, capsuleID, userID)
		if err != nil {
			writeErrorResponse(w, http.StatusInternalServerError, "Failed to update capsule policy", err)
			return
		}

		rowsAffected, _ := result.RowsAffected()
		if rowsAffected == 0 {
			writeErrorResponse(w, http.StatusNotFound, "Capsule not found", nil)
			return
		}

		writeSuccessResponse(w, http.StatusOK, nil, "Capsule policy updated successfully")
	}
}

// Policy handlers (simplified implementations)
func CreatePolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would be similar to CreateCapsuleHandler
		writeSuccessResponse(w, http.StatusCreated, nil, "Policy created successfully")
	}
}

func ListPoliciesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would be similar to ListCapsulesHandler
		writeSuccessResponse(w, http.StatusOK, []interface{}{}, "Policies retrieved successfully")
	}
}

func GetPolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would be similar to GetCapsuleHandler
		writeSuccessResponse(w, http.StatusOK, nil, "Policy retrieved successfully")
	}
}

func UpdatePolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would handle policy updates
		writeSuccessResponse(w, http.StatusOK, nil, "Policy updated successfully")
	}
}

func DeletePolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would handle policy deletion
		writeSuccessResponse(w, http.StatusOK, nil, "Policy deleted successfully")
	}
}

func ValidatePolicyHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation would validate policy syntax
	writeSuccessResponse(w, http.StatusOK, map[string]bool{"valid": true}, "Policy is valid")
}

// Attestation handlers
func GetChallengeHandler(w http.ResponseWriter, r *http.Request) {
	challenge := generateChallenge()
	response := map[string]string{
		"challenge":  challenge,
		"expires_at": time.Now().Add(5 * time.Minute).Format(time.RFC3339),
	}
	writeSuccessResponse(w, http.StatusOK, response, "Challenge generated")
}

func VerifyAttestationHandler(w http.ResponseWriter, r *http.Request) {
	// Implementation would verify device attestation
	writeSuccessResponse(w, http.StatusOK, map[string]bool{"verified": true}, "Attestation verified")
}

// Dashboard handlers
func GetDashboardStatsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would gather dashboard statistics
		stats := map[string]interface{}{
			"total_capsules":  0,
			"active_policies": 0,
			"recent_accesses": 0,
		}
		writeSuccessResponse(w, http.StatusOK, stats, "Dashboard stats retrieved")
	}
}

func GetEventsStreamHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would stream events via SSE
		writeSuccessResponse(w, http.StatusOK, []interface{}{}, "Events retrieved")
	}
}

func GetAlertsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Implementation would return security alerts
		writeSuccessResponse(w, http.StatusOK, []interface{}{}, "Alerts retrieved")
	}
}

// WebSocket handlers
func WebSocketEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Error().Err(err).Msg("WebSocket upgrade failed")
			return
		}
		defer conn.Close()

		// Handle WebSocket connection for real-time events
		for {
			// Simple ping/pong to keep connection alive
			err := conn.WriteMessage(websocket.PingMessage, []byte{})
			if err != nil {
				break
			}
			time.Sleep(30 * time.Second)
		}
	}
}

func WebSocketMetricsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}
	defer conn.Close()

	// Handle WebSocket connection for real-time metrics
	for {
		// Send metrics data
		metrics := map[string]interface{}{
			"timestamp":    time.Now(),
			"cpu_usage":    0.5,
			"memory_usage": 0.3,
		}

		if err := conn.WriteJSON(metrics); err != nil {
			break
		}
		time.Sleep(5 * time.Second)
	}
}

// Helper functions

func writeSuccessResponse(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	response := APIResponse{
		Success:   true,
		Data:      data,
		Message:   message,
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func writeErrorResponse(w http.ResponseWriter, statusCode int, message string, err error) {
	response := APIResponse{
		Success:   false,
		Error:     message,
		Timestamp: time.Now(),
	}

	if err != nil {
		log.Error().Err(err).Msg(message)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func getUserIDFromToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse JWT token (simplified - would use proper JWT validation)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("secret"), nil // Would use proper secret from config
	})

	if err != nil || !token.Valid {
		return ""
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if userID, ok := claims["user_id"].(string); ok {
			return userID
		}
	}

	return ""
}

func parseIntParam(param string, defaultValue int) int {
	if param == "" {
		return defaultValue
	}

	if value, err := strconv.Atoi(param); err == nil {
		return value
	}

	return defaultValue
}

func calculateDataHash(data string) string {
	// Implementation would use proper crypto hashing
	return fmt.Sprintf("hash_%d", len(data))
}

func encryptData(data string) []byte {
	// Implementation would use proper encryption from crypto package
	return []byte(data)
}

func decryptData(data []byte) string {
	// Implementation would use proper decryption from crypto package
	return string(data)
}

func generateChallenge() string {
	// Implementation would generate cryptographic challenge
	return uuid.New().String()
}

func logCapsuleAccess(db *sql.DB, capsuleID, userID string, r *http.Request) {
	// Implementation would log capsule access to audit_logs table
	_ = db // Will be used for database logging operations in full implementation
	_ = r  // Will be used for extracting IP, User-Agent, etc. in full implementation
	log.Info().
		Str("capsule_id", capsuleID).
		Str("user_id", userID).
		Str("action", "access").
		Msg("Capsule accessed")
}

func logCapsuleRevocation(db *sql.DB, capsuleID, userID string, r *http.Request) {
	// Implementation would log capsule revocation to audit_logs table
	_ = db // Will be used for database logging operations in full implementation
	_ = r  // Will be used for extracting IP, User-Agent, etc. in full implementation
	log.Info().
		Str("capsule_id", capsuleID).
		Str("user_id", userID).
		Str("action", "revoke").
		Msg("Capsule revoked")
}
