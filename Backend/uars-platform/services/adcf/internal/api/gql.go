package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/portalvii/uars7/services/adcf/internal/capsules"
	"github.com/portalvii/uars7/services/adcf/internal/policy"
)

// GraphQLRequest represents a GraphQL request
type GraphQLRequest struct {
	Query         string                 `json:"query"`
	OperationName string                 `json:"operationName"`
	Variables     map[string]interface{} `json:"variables"`
}

// GraphQLResponse represents a GraphQL response
type GraphQLResponse struct {
	Data   interface{}    `json:"data,omitempty"`
	Errors []GraphQLError `json:"errors,omitempty"`
}

// GraphQLError represents a GraphQL error
type GraphQLError struct {
	Message    string                 `json:"message"`
	Locations  []GraphQLLocation      `json:"locations,omitempty"`
	Path       []interface{}          `json:"path,omitempty"`
	Extensions map[string]interface{} `json:"extensions,omitempty"`
}

// GraphQLLocation represents an error location
type GraphQLLocation struct {
	Line   int `json:"line"`
	Column int `json:"column"`
}

// GraphQLHandler handles secure GraphQL requests for ADCF capsules
func GraphQLHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GraphQLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Extract context from headers and variables
	ctxData := map[string]interface{}{}
	for k, v := range req.Variables {
		ctxData[k] = v
	}
	// Example: extract intent token from header
	intentToken := r.Header.Get("X-Intent-Token")
	if intentToken != "" {
		ctxData["intent_token"] = intentToken
	}
	// TODO: extract Ed25519 signature, ZKP proof, etc.

	// Build policy context
	policyCtx := &policy.PolicyContext{}
	ctxBytes, _ := json.Marshal(ctxData)
	json.Unmarshal(ctxBytes, policyCtx)

	// Enforce policy before handling query
	engine := policy.NewEngine() // In real code, use shared instance
	result, err := engine.EvaluatePolicy(r.Context(), policyCtx)
	if err != nil || result.Decision != "allow" {
		ErrorResponse(w, http.StatusForbidden, "Access denied by policy")
		return
	}

	// Handle CRUD operations (simplified)
	var gqlData interface{}
	switch {
	case req.Query == "query Capsules":
		// Relay-style pagination
		_ = ""  // after (placeholder)
		_ = 10  // first (placeholder)
		if v, ok := req.Variables["after"].(string); ok {
			_ = v // after would be used for pagination
		}
		if v, ok := req.Variables["first"].(string); ok {
			if n, err := strconv.Atoi(v); err == nil {
				_ = n // first would be used for pagination
			}
		}
		// Simplified capsules list for demo
		gqlData = map[string]interface{}{
			"edges": []interface{}{},
			"pageInfo": map[string]interface{}{
				"hasNextPage": false,
				"endCursor":   "",
			},
		}
	case req.Query == "mutation MintCapsule":
		// Mint capsule
		mintReq := capsules.MintRequest{}
		mintBytes, _ := json.Marshal(req.Variables)
		json.Unmarshal(mintBytes, &mintReq)
		id, err := capsules.Mint(nil, mintReq, policyCtx.Purpose) // ownerID as purpose for demo
		if err != nil {
			ErrorResponse(w, http.StatusInternalServerError, "Mint failed")
			return
		}
		gqlData = map[string]interface{}{"id": id}
	case req.Query == "mutation RevokeCapsule":
		// Revoke capsule
		id := ""
		if v, ok := req.Variables["id"].(string); ok {
			id = v
		}
		// Simplified revoke for demo (would need proper DB connection)
		if id == "" {
			ErrorResponse(w, http.StatusBadRequest, "Capsule ID required")
			return
		}
		gqlData = map[string]interface{}{"revoked": true}
	default:
		gqlData = map[string]interface{}{"message": "GraphQL endpoint working", "query": req.Query}
	}

	response := GraphQLResponse{
		Data: gqlData,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GraphQLPlaygroundHandler serves the GraphQL playground
func GraphQLPlaygroundHandler(w http.ResponseWriter, r *http.Request) {
	playground := `<!DOCTYPE html>
<html>
<head>
	<title>GraphQL Playground</title>
</head>
<body>
	<h1>ADCF GraphQL Playground</h1>
	<p>GraphQL endpoint available at /graphql</p>
</body>
</html>`
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(playground))
}
