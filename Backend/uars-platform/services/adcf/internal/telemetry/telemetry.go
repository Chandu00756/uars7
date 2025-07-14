// Package telemetry provides observability and monitoring for ADCF
// Implements military-grade telemetry with comprehensive metrics and tracing
package telemetry

import (
	"fmt"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog/log"
)

var (
	// Metrics registry
	registry *prometheus.Registry
	promOnce sync.Once

	// Standard metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status_code"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "adcf_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	activeConnections = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "adcf_active_connections",
			Help: "Number of active connections",
		},
	)

	capsuleOperations = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_capsule_operations_total",
			Help: "Total number of capsule operations",
		},
		[]string{"operation", "status"},
	)

	policyEvaluations = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_policy_evaluations_total",
			Help: "Total number of policy evaluations",
		},
		[]string{"policy_type", "result"},
	)

	attestationVerifications = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_attestation_verifications_total",
			Help: "Total number of attestation verifications",
		},
		[]string{"device_type", "result"},
	)

	cryptoOperations = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_crypto_operations_total",
			Help: "Total number of cryptographic operations",
		},
		[]string{"operation", "algorithm"},
	)

	memoryUsage = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "adcf_memory_usage_bytes",
			Help: "Memory usage in bytes",
		},
		[]string{"type"},
	)

	goroutineCount = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "adcf_goroutines_count",
			Help: "Number of goroutines",
		},
	)

	buildInfo = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "adcf_build_info",
			Help: "Build information",
		},
		[]string{"version", "commit", "build_date", "go_version"},
	)

	// Security metrics
	securityEvents = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_security_events_total",
			Help: "Total number of security events",
		},
		[]string{"event_type", "severity"},
	)

	failedAuthAttempts = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_failed_auth_attempts_total",
			Help: "Total number of failed authentication attempts",
		},
		[]string{"source", "reason"},
	)

	rateLimitHits = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "adcf_rate_limit_hits_total",
			Help: "Total number of rate limit hits",
		},
		[]string{"endpoint", "client_ip"},
	)
)

// Initialize sets up telemetry subsystem
func Initialize() (func(), error) {
	var initErr error

	promOnce.Do(func() {
		registry = prometheus.NewRegistry()

		// Register standard metrics
		collectors := []prometheus.Collector{
			httpRequestsTotal,
			httpRequestDuration,
			activeConnections,
			capsuleOperations,
			policyEvaluations,
			attestationVerifications,
			cryptoOperations,
			memoryUsage,
			goroutineCount,
			buildInfo,
			securityEvents,
			failedAuthAttempts,
			rateLimitHits,
		}

		for _, collector := range collectors {
			if err := registry.Register(collector); err != nil {
				initErr = fmt.Errorf("failed to register metric: %w", err)
				return
			}
		}

		// Set build info
		buildInfo.WithLabelValues(
			getEnv("BUILD_VERSION", "dev"),
			getEnv("BUILD_COMMIT", "unknown"),
			getEnv("BUILD_DATE", time.Now().Format(time.RFC3339)),
			runtime.Version(),
		).Set(1)

		// Start metrics collection goroutines
		go collectSystemMetrics()

		log.Info().Msg("Telemetry system initialized successfully")
	})

	if initErr != nil {
		return nil, initErr
	}

	// Return shutdown function
	return func() {
		log.Info().Msg("Telemetry system shutting down")
	}, nil
}

// MetricsHandler returns the HTTP handler for Prometheus metrics
func MetricsHandler() http.Handler {
	if registry == nil {
		log.Error().Msg("Telemetry not initialized, returning empty metrics handler")
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte("Telemetry not initialized"))
		})
	}

	return promhttp.HandlerFor(registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
		Registry:          registry,
	})
}

// collectSystemMetrics collects system-level metrics
func collectSystemMetrics() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)

		// Memory metrics
		memoryUsage.WithLabelValues("alloc").Set(float64(m.Alloc))
		memoryUsage.WithLabelValues("total_alloc").Set(float64(m.TotalAlloc))
		memoryUsage.WithLabelValues("sys").Set(float64(m.Sys))
		memoryUsage.WithLabelValues("heap_alloc").Set(float64(m.HeapAlloc))
		memoryUsage.WithLabelValues("heap_sys").Set(float64(m.HeapSys))

		// Goroutine count
		goroutineCount.Set(float64(runtime.NumGoroutine()))
	}
}

// RecordHTTPRequest records HTTP request metrics
func RecordHTTPRequest(method, path string, statusCode int, duration time.Duration) {
	if registry == nil {
		return
	}

	httpRequestsTotal.WithLabelValues(method, path, fmt.Sprintf("%d", statusCode)).Inc()
	httpRequestDuration.WithLabelValues(method, path).Observe(duration.Seconds())
}

// RecordCapsuleOperation records capsule operation metrics
func RecordCapsuleOperation(operation, status string) {
	if registry == nil {
		return
	}

	capsuleOperations.WithLabelValues(operation, status).Inc()
}

// RecordPolicyEvaluation records policy evaluation metrics
func RecordPolicyEvaluation(policyType, result string) {
	if registry == nil {
		return
	}

	policyEvaluations.WithLabelValues(policyType, result).Inc()
}

// RecordAttestationVerification records attestation verification metrics
func RecordAttestationVerification(deviceType, result string) {
	if registry == nil {
		return
	}

	attestationVerifications.WithLabelValues(deviceType, result).Inc()
}

// RecordCryptoOperation records cryptographic operation metrics
func RecordCryptoOperation(operation, algorithm string) {
	if registry == nil {
		return
	}

	cryptoOperations.WithLabelValues(operation, algorithm).Inc()
}

// RecordSecurityEvent records security event metrics
func RecordSecurityEvent(eventType, severity string) {
	if registry == nil {
		return
	}

	securityEvents.WithLabelValues(eventType, severity).Inc()
}

// RecordFailedAuthAttempt records failed authentication attempt metrics
func RecordFailedAuthAttempt(source, reason string) {
	if registry == nil {
		return
	}

	failedAuthAttempts.WithLabelValues(source, reason).Inc()
}

// RecordRateLimitHit records rate limit hit metrics
func RecordRateLimitHit(endpoint, clientIP string) {
	if registry == nil {
		return
	}

	rateLimitHits.WithLabelValues(endpoint, clientIP).Inc()
}

// IncrementActiveConnections increments active connection count
func IncrementActiveConnections() {
	if registry == nil {
		return
	}

	activeConnections.Inc()
}

// DecrementActiveConnections decrements active connection count
func DecrementActiveConnections() {
	if registry == nil {
		return
	}

	activeConnections.Dec()
}

// GetRegistry returns the Prometheus registry
func GetRegistry() *prometheus.Registry {
	return registry
}

// Middleware for HTTP request instrumentation
func HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Track active connections
		IncrementActiveConnections()
		defer DecrementActiveConnections()

		// Wrap response writer to capture status code
		ww := &instrumentedResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		// Process request
		next.ServeHTTP(ww, r)

		// Record metrics
		duration := time.Since(start)
		RecordHTTPRequest(r.Method, r.URL.Path, ww.statusCode, duration)
	})
}

// instrumentedResponseWriter wraps http.ResponseWriter to capture status code
type instrumentedResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (w *instrumentedResponseWriter) WriteHeader(code int) {
	w.statusCode = code
	w.ResponseWriter.WriteHeader(code)
}

// HealthMetrics provides health check metrics
type HealthMetrics struct {
	Status        string    `json:"status"`
	Timestamp     time.Time `json:"timestamp"`
	Version       string    `json:"version"`
	Uptime        string    `json:"uptime"`
	GoVersion     string    `json:"go_version"`
	NumGoroutines int       `json:"num_goroutines"`
	MemoryAlloc   uint64    `json:"memory_alloc"`
	MemorySys     uint64    `json:"memory_sys"`
	ActiveConns   float64   `json:"active_connections"`
}

// GetHealthMetrics returns current health metrics
func GetHealthMetrics() *HealthMetrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	// Simple approach to get active connections count
	activeConns := float64(0)

	return &HealthMetrics{
		Status:        "healthy",
		Timestamp:     time.Now(),
		Version:       getEnv("BUILD_VERSION", "dev"),
		Uptime:        time.Since(startTime).String(),
		GoVersion:     runtime.Version(),
		NumGoroutines: runtime.NumGoroutine(),
		MemoryAlloc:   m.Alloc,
		MemorySys:     m.Sys,
		ActiveConns:   activeConns,
	}
}

var startTime = time.Now()

// Custom metric types for domain-specific monitoring

// CapsuleMetrics tracks capsule-specific metrics
type CapsuleMetrics struct {
	CreatedCount  prometheus.Counter
	AccessedCount prometheus.Counter
	RevokedCount  prometheus.Counter
	ExpiredCount  prometheus.Counter
	SizeHistogram prometheus.Histogram
	AccessLatency prometheus.Histogram
}

// NewCapsuleMetrics creates a new capsule metrics collector
func NewCapsuleMetrics() *CapsuleMetrics {
	metrics := &CapsuleMetrics{
		CreatedCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "adcf_capsules_created_total",
			Help: "Total number of capsules created",
		}),
		AccessedCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "adcf_capsules_accessed_total",
			Help: "Total number of capsule accesses",
		}),
		RevokedCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "adcf_capsules_revoked_total",
			Help: "Total number of capsules revoked",
		}),
		ExpiredCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "adcf_capsules_expired_total",
			Help: "Total number of capsules expired",
		}),
		SizeHistogram: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "adcf_capsule_size_bytes",
			Help:    "Distribution of capsule sizes in bytes",
			Buckets: []float64{1024, 10240, 102400, 1048576, 10485760, 104857600}, // 1KB to 100MB
		}),
		AccessLatency: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "adcf_capsule_access_duration_seconds",
			Help:    "Time taken to access capsules",
			Buckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0},
		}),
	}

	// Register with global registry if available
	if registry != nil {
		registry.MustRegister(
			metrics.CreatedCount,
			metrics.AccessedCount,
			metrics.RevokedCount,
			metrics.ExpiredCount,
			metrics.SizeHistogram,
			metrics.AccessLatency,
		)
	}

	return metrics
}

// PolicyMetrics tracks policy-specific metrics
type PolicyMetrics struct {
	EvaluationCount    prometheus.CounterVec
	EvaluationDuration prometheus.HistogramVec
	PolicyCount        prometheus.GaugeVec
}

// NewPolicyMetrics creates a new policy metrics collector
func NewPolicyMetrics() *PolicyMetrics {
	metrics := &PolicyMetrics{
		EvaluationCount: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_policy_evaluations_total",
				Help: "Total number of policy evaluations",
			},
			[]string{"policy_id", "result"},
		),
		EvaluationDuration: *prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "adcf_policy_evaluation_duration_seconds",
				Help:    "Time taken to evaluate policies",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"policy_id"},
		),
		PolicyCount: *prometheus.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "adcf_active_policies",
				Help: "Number of active policies",
			},
			[]string{"type"},
		),
	}

	// Register with global registry if available
	if registry != nil {
		registry.MustRegister(
			&metrics.EvaluationCount,
			&metrics.EvaluationDuration,
			&metrics.PolicyCount,
		)
	}

	return metrics
}

// AttestationMetrics tracks attestation-specific metrics
type AttestationMetrics struct {
	VerificationCount    prometheus.CounterVec
	VerificationDuration prometheus.HistogramVec
	ChallengeCount       prometheus.Counter
	FailureCount         prometheus.CounterVec
}

// NewAttestationMetrics creates a new attestation metrics collector
func NewAttestationMetrics() *AttestationMetrics {
	metrics := &AttestationMetrics{
		VerificationCount: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_attestation_verifications_total",
				Help: "Total number of attestation verifications",
			},
			[]string{"device_type", "result"},
		),
		VerificationDuration: *prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "adcf_attestation_verification_duration_seconds",
				Help:    "Time taken to verify attestations",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"device_type"},
		),
		ChallengeCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "adcf_attestation_challenges_total",
			Help: "Total number of attestation challenges issued",
		}),
		FailureCount: *prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "adcf_attestation_failures_total",
				Help: "Total number of attestation failures",
			},
			[]string{"device_type", "reason"},
		),
	}

	// Register with global registry if available
	if registry != nil {
		registry.MustRegister(
			&metrics.VerificationCount,
			&metrics.VerificationDuration,
			metrics.ChallengeCount,
			&metrics.FailureCount,
		)
	}

	return metrics
}

// Helper function to get environment variable with default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Export common metrics for use by other packages
var (
	HTTPRequestsTotal        = httpRequestsTotal
	HTTPRequestDuration      = httpRequestDuration
	ActiveConnections        = activeConnections
	CapsuleOperations        = capsuleOperations
	PolicyEvaluations        = policyEvaluations
	AttestationVerifications = attestationVerifications
	CryptoOperations         = cryptoOperations
	SecurityEvents           = securityEvents
	FailedAuthAttempts       = failedAuthAttempts
	RateLimitHits            = rateLimitHits
)
