package telemetry

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"sync"
	"time"
)

// Metrics holds various system metrics
type Metrics struct {
	TotalRequests     int64             `json:"total_requests"`
	TotalCapsules     int64             `json:"total_capsules"`
	ActiveCapsules    int64             `json:"active_capsules"`
	TotalAccesses     int64             `json:"total_accesses"`
	TotalPolicies     int64             `json:"total_policies"`
	EncryptionOps     int64             `json:"encryption_operations"`
	PolicyEvaluations int64             `json:"policy_evaluations"`
	AuditEvents       int64             `json:"audit_events"`
	ErrorCount        int64             `json:"error_count"`
	SystemUptime      time.Duration     `json:"system_uptime"`
	MemoryUsage       runtime.MemStats  `json:"memory_usage"`
	GoroutineCount    int               `json:"goroutine_count"`
	LastActivity      time.Time         `json:"last_activity"`
	ComponentStatus   map[string]string `json:"component_status"`
}

// MetricsCollector manages system metrics collection
type MetricsCollector struct {
	metrics   *Metrics
	startTime time.Time
	mutex     sync.RWMutex
}

var globalCollector *MetricsCollector
var once sync.Once

// InitializeMetrics creates and returns the global metrics collector
func InitializeMetrics() *MetricsCollector {
	once.Do(func() {
		globalCollector = &MetricsCollector{
			metrics: &Metrics{
				ComponentStatus: make(map[string]string),
			},
			startTime: time.Now(),
		}

		// Set initial component statuses
		globalCollector.metrics.ComponentStatus["database"] = "unknown"
		globalCollector.metrics.ComponentStatus["policy_engine"] = "unknown"
		globalCollector.metrics.ComponentStatus["crypto"] = "unknown"
		globalCollector.metrics.ComponentStatus["ledger"] = "unknown"
		globalCollector.metrics.ComponentStatus["backup"] = "unknown"
		globalCollector.metrics.ComponentStatus["p2p"] = "unknown"
		globalCollector.metrics.ComponentStatus["attestation"] = "unknown"
	})
	return globalCollector
}

// GetCollector returns the global metrics collector
func GetCollector() *MetricsCollector {
	if globalCollector == nil {
		return InitializeMetrics()
	}
	return globalCollector
}

// IncrementTotalRequests increments the total request counter
func (mc *MetricsCollector) IncrementTotalRequests() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.TotalRequests++
	mc.metrics.LastActivity = time.Now()
}

// IncrementTotalCapsules increments the total capsules counter
func (mc *MetricsCollector) IncrementTotalCapsules() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.TotalCapsules++
}

// SetActiveCapsules sets the active capsules count
func (mc *MetricsCollector) SetActiveCapsules(count int64) {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.ActiveCapsules = count
}

// IncrementTotalAccesses increments the total accesses counter
func (mc *MetricsCollector) IncrementTotalAccesses() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.TotalAccesses++
	mc.metrics.LastActivity = time.Now()
}

// IncrementTotalPolicies increments the total policies counter
func (mc *MetricsCollector) IncrementTotalPolicies() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.TotalPolicies++
}

// IncrementEncryptionOps increments the encryption operations counter
func (mc *MetricsCollector) IncrementEncryptionOps() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.EncryptionOps++
}

// IncrementPolicyEvaluations increments the policy evaluations counter
func (mc *MetricsCollector) IncrementPolicyEvaluations() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.PolicyEvaluations++
}

// IncrementAuditEvents increments the audit events counter
func (mc *MetricsCollector) IncrementAuditEvents() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.AuditEvents++
}

// IncrementErrorCount increments the error counter
func (mc *MetricsCollector) IncrementErrorCount() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.ErrorCount++
}

// SetComponentStatus sets the status of a component
func (mc *MetricsCollector) SetComponentStatus(component, status string) {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()
	mc.metrics.ComponentStatus[component] = status
}

// UpdateSystemMetrics updates system-level metrics
func (mc *MetricsCollector) UpdateSystemMetrics() {
	mc.mutex.Lock()
	defer mc.mutex.Unlock()

	// Update runtime metrics
	runtime.ReadMemStats(&mc.metrics.MemoryUsage)
	mc.metrics.GoroutineCount = runtime.NumGoroutine()
	mc.metrics.SystemUptime = time.Since(mc.startTime)
}

// GetMetrics returns a copy of current metrics
func (mc *MetricsCollector) GetMetrics() *Metrics {
	mc.mutex.RLock()
	defer mc.mutex.RUnlock()

	// Update system metrics before returning
	mc.UpdateSystemMetrics()

	// Create a deep copy
	metricsCopy := &Metrics{
		TotalRequests:     mc.metrics.TotalRequests,
		TotalCapsules:     mc.metrics.TotalCapsules,
		ActiveCapsules:    mc.metrics.ActiveCapsules,
		TotalAccesses:     mc.metrics.TotalAccesses,
		TotalPolicies:     mc.metrics.TotalPolicies,
		EncryptionOps:     mc.metrics.EncryptionOps,
		PolicyEvaluations: mc.metrics.PolicyEvaluations,
		AuditEvents:       mc.metrics.AuditEvents,
		ErrorCount:        mc.metrics.ErrorCount,
		SystemUptime:      mc.metrics.SystemUptime,
		MemoryUsage:       mc.metrics.MemoryUsage,
		GoroutineCount:    mc.metrics.GoroutineCount,
		LastActivity:      mc.metrics.LastActivity,
		ComponentStatus:   make(map[string]string),
	}

	// Copy maps
	for k, v := range mc.metrics.ComponentStatus {
		metricsCopy.ComponentStatus[k] = v
	}

	return metricsCopy
}

// StartMetricsCollection starts background metrics collection
func (mc *MetricsCollector) StartMetricsCollection(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			mc.UpdateSystemMetrics()
		}
	}
}

// Global convenience functions
func IncrementRequests() {
	GetCollector().IncrementTotalRequests()
}

func IncrementCapsules() {
	GetCollector().IncrementTotalCapsules()
}

func IncrementAccesses() {
	GetCollector().IncrementTotalAccesses()
}

func IncrementPolicies() {
	GetCollector().IncrementTotalPolicies()
}

func IncrementEncryption() {
	GetCollector().IncrementEncryptionOps()
}

func IncrementPolicyEval() {
	GetCollector().IncrementPolicyEvaluations()
}

func IncrementAudit() {
	GetCollector().IncrementAuditEvents()
}

func IncrementErrors() {
	GetCollector().IncrementErrorCount()
}

func SetComponentStatus(component, status string) {
	GetCollector().SetComponentStatus(component, status)
}

// PrometheusHandler returns a simple metrics HTTP handler
func PrometheusHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		metrics := GetCollector().GetMetrics()

		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)

		// Write metrics in Prometheus text format
		fmt.Fprintf(w, "# HELP adcf_total_requests Total number of HTTP requests\n")
		fmt.Fprintf(w, "# TYPE adcf_total_requests counter\n")
		fmt.Fprintf(w, "adcf_total_requests %d\n", metrics.TotalRequests)

		fmt.Fprintf(w, "# HELP adcf_active_capsules Number of active capsules\n")
		fmt.Fprintf(w, "# TYPE adcf_active_capsules gauge\n")
		fmt.Fprintf(w, "adcf_active_capsules %d\n", metrics.ActiveCapsules)

		fmt.Fprintf(w, "# HELP adcf_total_policies Total number of policies\n")
		fmt.Fprintf(w, "# TYPE adcf_total_policies counter\n")
		fmt.Fprintf(w, "adcf_total_policies %d\n", metrics.TotalPolicies)

		fmt.Fprintf(w, "# HELP adcf_memory_alloc_bytes Allocated memory in bytes\n")
		fmt.Fprintf(w, "# TYPE adcf_memory_alloc_bytes gauge\n")
		fmt.Fprintf(w, "adcf_memory_alloc_bytes %d\n", metrics.MemoryUsage.Alloc)

		fmt.Fprintf(w, "# HELP adcf_goroutines Number of goroutines\n")
		fmt.Fprintf(w, "# TYPE adcf_goroutines gauge\n")
		fmt.Fprintf(w, "adcf_goroutines %d\n", metrics.GoroutineCount)
	})
}

// GetCurrentMetrics returns current metrics as a map for JSON responses
func GetCurrentMetrics() map[string]interface{} {
	metrics := GetCollector().GetMetrics()

	return map[string]interface{}{
		"total_requests":     metrics.TotalRequests,
		"active_capsules":    metrics.ActiveCapsules,
		"total_policies":     metrics.TotalPolicies,
		"encryption_ops":     metrics.EncryptionOps,
		"policy_evaluations": metrics.PolicyEvaluations,
		"audit_events":       metrics.AuditEvents,
		"error_count":        metrics.ErrorCount,
		"uptime_seconds":     metrics.SystemUptime.Seconds(),
		"memory_alloc_mb":    metrics.MemoryUsage.Alloc / 1024 / 1024,
		"goroutines":         metrics.GoroutineCount,
		"component_status":   metrics.ComponentStatus,
	}
}
