// Package api provides middleware functions for ADCF HTTP API
// Implements security, logging, and validation middleware
package api

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"golang.org/x/time/rate"
)

// RequestIDKey is the context key for request IDs
type RequestIDKey struct{}

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Process request
		next.ServeHTTP(ww, r)

		// Log request
		duration := time.Since(start)
		log.Info().
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Str("remote_addr", r.RemoteAddr).
			Str("user_agent", r.UserAgent()).
			Int("status_code", ww.statusCode).
			Dur("duration", duration).
			Msg("HTTP request processed")
	})
}

// RateLimitMiddleware implements rate limiting
func RateLimitMiddleware(limiter *rate.Limiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow() {
				log.Warn().
					Str("remote_addr", r.RemoteAddr).
					Msg("Rate limit exceeded")

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				w.Write([]byte(`{"success": false, "error": "Rate limit exceeded"}`))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// SecurityHeadersMiddleware adds security headers
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Content-Security-Policy", "default-src 'self'")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		next.ServeHTTP(w, r)
	})
}

// RequestIDMiddleware adds a unique request ID to each request
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Generate or extract request ID
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Add to response header
		w.Header().Set("X-Request-ID", requestID)

		// Add to context
		ctx := context.WithValue(r.Context(), RequestIDKey{}, requestID)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health endpoints
		if strings.HasPrefix(r.URL.Path, "/healthz") ||
			strings.HasPrefix(r.URL.Path, "/readiness") ||
			strings.HasPrefix(r.URL.Path, "/metrics") {
			next.ServeHTTP(w, r)
			return
		}

		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Warn().
				Str("path", r.URL.Path).
				Str("remote_addr", r.RemoteAddr).
				Msg("Missing Authorization header")

			writeUnauthorizedResponse(w, "Missing Authorization header")
			return
		}

		// Extract Bearer token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.Warn().
				Str("path", r.URL.Path).
				Str("remote_addr", r.RemoteAddr).
				Msg("Invalid Authorization header format")

			writeUnauthorizedResponse(w, "Invalid Authorization header format")
			return
		}

		// Validate JWT token (simplified - would use proper validation)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verify signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// Return secret (would come from config)
			return []byte("your-secret-key"), nil
		})

		if err != nil || !token.Valid {
			log.Warn().
				Err(err).
				Str("path", r.URL.Path).
				Str("remote_addr", r.RemoteAddr).
				Msg("Invalid JWT token")

			writeUnauthorizedResponse(w, "Invalid or expired token")
			return
		}

		// Add user info to context if needed
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			ctx := context.WithValue(r.Context(), "user_claims", claims)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func writeUnauthorizedResponse(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	response := fmt.Sprintf(`{"success": false, "error": "%s", "timestamp": "%s"}`,
		message, time.Now().Format(time.RFC3339))
	w.Write([]byte(response))
}
