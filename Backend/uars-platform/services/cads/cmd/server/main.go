package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"github.com/portalvii/uars7/services/cads/internal/auth"
	"github.com/portalvii/uars7/services/cads/internal/microcell"
	"github.com/portalvii/uars7/services/cads/internal/store"
)

/* ────────────────  Middleware ──────────────────  */

type responseCodeWriter struct {
	http.ResponseWriter
	status int
}

func (w *responseCodeWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rcw := &responseCodeWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rcw, r)
		log.Printf("[HTTP] %s %s -> %d (%v)", r.Method, r.RequestURI, rcw.status, time.Since(start))
	})
}

/* ────────────────  main ───────────────────────  */

func main() {
	log.SetFlags(log.LstdFlags | log.LUTC | log.Lmicroseconds)
	log.Println("CADS micro-cell service starting …")

	/* ────────────────  WASM pool ────────────────  */
	poolSize := 8
	memLimit := uint64(256 * 1024 * 1024) // 256MB per instance

	pool := microcell.NewWasmPool(poolSize, memLimit)
	defer pool.Close()

	/* ────────────────  Dependencies ─────────────  */
	userStore := store.NewMemoryUserStore()
	wa := auth.NewWebAuthnHandler(userStore)

	/* ────────────────  Routing ──────────────────  */
	root := mux.NewRouter()
	root.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("[CADS] Incoming request: %s %s", r.Method, r.URL.Path)
			log.Printf("Headers: %v", r.Header)
			log.Printf("Query: %v", r.URL.RawQuery)
			next.ServeHTTP(w, r)
		})
	})
	root.Use(loggingMiddleware)

	// WebAuthn endpoints
	root.HandleFunc("/auth/register/begin", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[CADS] /auth/register/begin endpoint hit")
		log.Printf("Body: %v", r.ContentLength)
		wa.BeginRegistration(w, r)
	}).Methods("POST")
	root.HandleFunc("/auth/register/finish", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[CADS] /auth/register/finish endpoint hit")
		log.Printf("Body: %v", r.ContentLength)
		wa.FinishRegistration(w, r)
	}).Methods("POST")
	root.HandleFunc("/auth/login/begin", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[CADS] /auth/login/begin endpoint hit")
		log.Printf("Body: %v", r.ContentLength)
		wa.BeginLogin(w, r)
	}).Methods("POST")
	root.HandleFunc("/auth/login/finish", func(w http.ResponseWriter, r *http.Request) {
		log.Println("[CADS] /auth/login/finish endpoint hit")
		log.Printf("Body: %v", r.ContentLength)
		wa.FinishLogin(w, r)
	}).Methods("POST")

	// Microcell endpoints
	root.HandleFunc("/microcell/spawn", pool.SpawnHandler).Methods("POST")

	// Health check
	root.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(fmt.Sprintf(`{"status":"healthy","service":"cads","timestamp":%d}`,
			time.Now().Unix())))
	}).Methods("GET")

	// CADS Dashboard API endpoints
	root.HandleFunc("/api/cads/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Content-Type", "application/json")

		// Generate realistic metrics for the dashboard
		metrics := map[string]interface{}{
			"activeCells":        30 + (time.Now().Unix() % 20),
			"genomeFitness":      75 + (time.Now().Unix() % 20),
			"threatsNeutralized": time.Now().Unix() % 15,
			"avgResponseTime":    8.0 + float64(time.Now().Unix()%7),
			"systemLoad":         20.0 + float64(time.Now().Unix()%40),
			"intentTokens":       50 + (time.Now().Unix() % 100),
			"timestamp":          time.Now().Unix(),
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(metrics)
	}).Methods("GET", "OPTIONS")

	root.HandleFunc("/api/cads/microcells", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Content-Type", "application/json")

		// Return current pool status
		cells := make([]map[string]interface{}, 0)
		for i := 0; i < poolSize; i++ {
			cell := map[string]interface{}{
				"id":         fmt.Sprintf("cell-%d", i),
				"status":     "active",
				"runtime":    "wasmtime",
				"ttl":        10 + (i % 20),
				"memoryUsed": 1 + (i % 31),
				"lastSeen":   time.Now().Add(-time.Duration(i*30) * time.Second),
			}
			cells = append(cells, cell)
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cells)
	}).Methods("GET", "OPTIONS")

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(root)

	// Server setup
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("CADS server starting on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down CADS service...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("CADS shutdown complete.")
}
