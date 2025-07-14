# Build configuration
.PHONY: build-all test-all clean dev-up dev-down deploy-prod

# Go build settings
GOOS ?= linux
GOARCH ?= amd64
CGO_ENABLED ?= 0

# Docker settings
DOCKER_REGISTRY ?= uars7-registry
DOCKER_TAG ?= latest

# Service names
SERVICES = cads m-ses shel ilecg qvdm trdn adcf

# Build all services
build-all:
	@echo "Building all services..."
	@for service in $(SERVICES); do \
		echo "Building $$service..."; \
		cd services/$$service && go build -o ../../bin/$$service ./cmd/server && cd ../..; \
	done

# Test all services
test-all:
	@echo "Running tests..."
	go test -v ./...
	@for service in $(SERVICES); do \
		echo "Testing $$service..."; \
		cd services/$$service && go test -v ./... && cd ../..; \
	done

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -rf bin/
	go clean ./...

# Development environment
dev-up:
	@echo "Starting development environment..."
	docker-compose -f dev/docker-compose.yml up -d
	
dev-down:
	@echo "Stopping development environment..."
	docker-compose -f dev/docker-compose.yml down

# Build Docker images
docker-build:
	@for service in $(SERVICES); do \
		echo "Building Docker image for $$service..."; \
		docker build -t $(DOCKER_REGISTRY)/$$service:$(DOCKER_TAG) -f services/$$service/Dockerfile .; \
	done

# Deploy to production
deploy-prod:
	@echo "Deploying to production..."
	kubectl apply -f infrastructure/k8s/

# Generate protobuf files
proto-gen:
	@echo "Generating protobuf files..."
	protoc --go_out=. --go-grpc_out=. shared/proto/*.proto

# Run linting
lint:
	golangci-lint run ./...

# Security scan
security-scan:
	gosec ./...

# Initialize dependencies
deps:
	go mod download
	go mod tidy
