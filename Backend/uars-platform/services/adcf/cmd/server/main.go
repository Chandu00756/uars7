package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
	"golang.org/x/time/rate"
)

type Server struct {
	db           *sql.DB
	router       *mux.Router
	httpServer   *http.Server
	rateLimiter  *rate.Limiter
	shutdownOnce sync.Once
	ctx          context.Context
	cancel       context.CancelFunc
}

func main() {
	log.Println("ADCF starting...")

	server, err := NewServer()
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	if err := server.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}

	server.WaitForShutdown()
}

func NewServer() (*Server, error) {
	ctx, cancel := context.WithCancel(context.Background())

	dsn := getEnv("POSTGRES_DSN", "postgres://postgres:password@localhost:5432/adcf?sslmode=disable")

	db, err := initDatabase(dsn)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("database init failed: %w", err)
	}

	rps := getEnvInt("RATE_LIMIT_RPS", 100)
	rateLimiter := rate.NewLimiter(rate.Limit(rps), rps*2)

	router := setupRouter(db, rateLimiter)

	httpServer := &http.Server{
		Addr:              ":" + getEnv("HTTP_PORT", "8083"),
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	return &Server{
		db:          db,
		router:      router,
		httpServer:  httpServer,
		rateLimiter: rateLimiter,
		ctx:         ctx,
		cancel:      cancel,
	}, nil
}

func (s *Server) Start() error {
	go func() {
		log.Printf("HTTP server starting on %s", s.httpServer.Addr)
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP server error: %v", err)
		}
	}()
	return nil
}

func (s *Server) WaitForShutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	sig := <-stop
	log.Printf("Shutdown signal: %s", sig.String())
	s.Shutdown()
}

func (s *Server) Shutdown() {
	s.shutdownOnce.Do(func() {
		log.Println("Shutting down...")
		s.cancel()

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := s.httpServer.Shutdown(shutdownCtx); err != nil {
			log.Printf("HTTP server shutdown error: %v", err)
		}

		if s.db != nil {
			if err := s.db.Close(); err != nil {
				log.Printf("Database close error: %v", err)
			}
		}

		log.Println("Shutdown complete")
	})
}

func setupRouter(db *sql.DB, rateLimiter *rate.Limiter) *mux.Router {
	r := mux.NewRouter()

	// TODO: Implement rate limiting middleware using rateLimiter
	_ = rateLimiter // Will be used for request rate limiting in full implementation

	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"https://portal.uars7.com",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	r.Use(c.Handler)

	r.HandleFunc("/healthz", healthHandler).Methods("GET")
	r.HandleFunc("/readiness", readinessHandler(db)).Methods("GET")

	apiV1 := r.PathPrefix("/api/v1").Subrouter()

	capsuleRouter := apiV1.PathPrefix("/capsules").Subrouter()
	capsuleRouter.HandleFunc("", createCapsuleHandler(db)).Methods("POST")
	capsuleRouter.HandleFunc("", listCapsulesHandler(db)).Methods("GET")
	capsuleRouter.HandleFunc("/{id}", getCapsuleHandler(db)).Methods("GET")

	policyRouter := apiV1.PathPrefix("/policies").Subrouter()
	policyRouter.HandleFunc("", createPolicyHandler(db)).Methods("POST")
	policyRouter.HandleFunc("", listPoliciesHandler(db)).Methods("GET")
	policyRouter.HandleFunc("/{id}", getPolicyHandler(db)).Methods("GET")

	return r
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"healthy","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
}

func readinessHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusServiceUnavailable)
			fmt.Fprintf(w, `{"status":"not ready","error":"%s"}`, err.Error())
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status":"ready","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func createCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database operations using db
		_ = db // Will be used for capsule CRUD operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		fmt.Fprintf(w, `{"message":"Capsule created","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func listCapsulesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database queries using db
		_ = db // Will be used for capsule listing operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"capsules":[],"timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func getCapsuleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database queries using db
		_ = db // Will be used for capsule retrieval operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"capsule":null,"timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func createPolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database operations using db
		_ = db // Will be used for policy CRUD operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		fmt.Fprintf(w, `{"message":"Policy created","timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func listPoliciesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database queries using db
		_ = db // Will be used for policy listing operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"policies":[],"timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func getPolicyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement database queries using db
		_ = db // Will be used for policy retrieval operations in full implementation
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"policy":null,"timestamp":"%s"}`, time.Now().Format(time.RFC3339))
	}
}

func initDatabase(dsn string) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if err := runMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}

func runMigrations(db *sql.DB) error {
	migrations := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

		`CREATE TABLE IF NOT EXISTS capsules (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			owner_id VARCHAR(255) NOT NULL,
			data_hash VARCHAR(128) NOT NULL,
			policy_id UUID,
			encrypted_blob BYTEA NOT NULL,
			metadata JSONB DEFAULT '{}',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			expires_at TIMESTAMP WITH TIME ZONE,
			revoked BOOLEAN DEFAULT FALSE,
			self_destruct BOOLEAN DEFAULT FALSE,
			access_count INTEGER DEFAULT 0,
			locked_until TIMESTAMP WITH TIME ZONE,
			size_bytes BIGINT DEFAULT 0
		)`,

		`CREATE TABLE IF NOT EXISTS policies (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			name VARCHAR(255) NOT NULL,
			description TEXT,
			policy_document JSONB NOT NULL,
			schema_version INTEGER DEFAULT 1,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			created_by VARCHAR(255) NOT NULL,
			active BOOLEAN DEFAULT TRUE
		)`,

		`CREATE TABLE IF NOT EXISTS audit_logs (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			capsule_id UUID REFERENCES capsules(id),
			policy_id UUID REFERENCES policies(id),
			action VARCHAR(50) NOT NULL,
			actor_id VARCHAR(255) NOT NULL,
			timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			details JSONB DEFAULT '{}',
			ip_address INET,
			user_agent TEXT,
			geo_location VARCHAR(10),
			device_fingerprint VARCHAR(128),
			intent_token_hash VARCHAR(128),
			success BOOLEAN DEFAULT TRUE,
			error_message TEXT
		)`,
	}

	for i, migration := range migrations {
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("migration %d failed: %w", i+1, err)
		}
	}

	log.Printf("Migrations completed (%d)", len(migrations))
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}
