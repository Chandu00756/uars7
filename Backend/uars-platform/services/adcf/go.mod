module github.com/portalvii/uars7/services/adcf

go 1.22.5

require (
	// Security and authentication
	github.com/golang-jwt/jwt/v5 v5.2.1
	// Core HTTP and routing
	github.com/gorilla/mux v1.8.1
	github.com/gorilla/websocket v1.5.1

	// Database
	github.com/lib/pq v1.10.9

	// Observability and monitoring
	github.com/prometheus/client_golang v1.19.1

	// Utilities
	github.com/rs/cors v1.10.1
	github.com/rs/zerolog v1.32.0
	golang.org/x/crypto v0.23.0
	golang.org/x/time v0.5.0
)

require github.com/google/uuid v1.6.0

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/prometheus/client_model v0.6.1 // indirect
	github.com/prometheus/common v0.48.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	golang.org/x/net v0.25.0 // indirect
	golang.org/x/sys v0.20.0 // indirect
	google.golang.org/protobuf v1.34.1 // indirect
)
