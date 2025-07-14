# UARS ADCF Makefile
# Military-grade build and deployment automation

.PHONY: help build test clean dev deploy security lint format deps docker wasm

# Default target
.DEFAULT_GOAL := help

# Variables
APP_NAME := adcf
VERSION := 1.0.0
BUILD_DIR := ./build
DOCKER_REGISTRY := registry.uars.platform
DOCKER_IMAGE := $(DOCKER_REGISTRY)/uars/$(APP_NAME)
WASM_DIR := ./wasm/policy-engine
GO_FILES := $(shell find . -type f -name '*.go' -not -path "./vendor/*")
RUST_FILES := $(shell find $(WASM_DIR) -type f -name '*.rs')

# Build info
BUILD_TIME := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Go build flags
LDFLAGS := -w -s \
	-X main.version=$(VERSION) \
	-X main.buildTime=$(BUILD_TIME) \
	-X main.gitCommit=$(GIT_COMMIT) \
	-X main.gitBranch=$(GIT_BRANCH)

# Color codes for output
RED := \033[31m
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
MAGENTA := \033[35m
CYAN := \033[36m
RESET := \033[0m

## Help
help: ## Display this help message
	@echo "$(CYAN)UARS ADCF - Military-Grade Data Protection Service$(RESET)"
	@echo "$(CYAN)=============================================$(RESET)"
	@echo ""
	@echo "$(GREEN)Available targets:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Examples:$(RESET)"
	@echo "  make dev          # Start development environment"
	@echo "  make build        # Build the application"
	@echo "  make test         # Run all tests"
	@echo "  make security     # Run security checks"
	@echo ""

## Development
dev: deps wasm ## Start development environment with hot reload
	@echo "$(GREEN)Starting ADCF development environment...$(RESET)"
	@docker-compose -f dev/docker-compose.yml up --build -d
	@echo "$(GREEN)Development environment started!$(RESET)"
	@echo "$(CYAN)Services available at:$(RESET)"
	@echo "  - ADCF API:      http://localhost:8080"
	@echo "  - Metrics:       http://localhost:9090"
	@echo "  - Grafana:       http://localhost:3000 (admin/admin)"
	@echo "  - Jaeger:        http://localhost:16686"
	@echo "  - Prometheus:    http://localhost:9091"

dev-stop: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(RESET)"
	@docker-compose -f dev/docker-compose.yml down
	@echo "$(GREEN)Development environment stopped$(RESET)"

dev-logs: ## Show development logs
	@docker-compose -f dev/docker-compose.yml logs -f adcf

## Building
deps: ## Install dependencies
	@echo "$(GREEN)Installing Go dependencies...$(RESET)"
	@go mod download
	@go mod tidy
	@go mod verify
	@echo "$(GREEN)Installing Rust dependencies...$(RESET)"
	@cd $(WASM_DIR) && cargo fetch

wasm: ## Build WASM policy engine
	@echo "$(GREEN)Building WASM policy engine...$(RESET)"
	@cd $(WASM_DIR) && chmod +x build.sh && ./build.sh
	@echo "$(GREEN)WASM policy engine built successfully$(RESET)"

build: deps wasm ## Build the application
	@echo "$(GREEN)Building ADCF service...$(RESET)"
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=1 go build \
		-ldflags="$(LDFLAGS)" \
		-o $(BUILD_DIR)/$(APP_NAME) \
		./cmd/server/
	@CGO_ENABLED=1 go build \
		-ldflags="$(LDFLAGS)" \
		-o $(BUILD_DIR)/migrate \
		./cmd/migrate/
	@echo "$(GREEN)Build completed: $(BUILD_DIR)/$(APP_NAME)$(RESET)"

build-race: deps wasm ## Build with race detection
	@echo "$(GREEN)Building ADCF with race detection...$(RESET)"
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=1 go build \
		-race \
		-ldflags="$(LDFLAGS)" \
		-o $(BUILD_DIR)/$(APP_NAME)-race \
		./cmd/server/
	@echo "$(GREEN)Race-enabled build completed$(RESET)"

## Testing
test: ## Run all tests
	@echo "$(GREEN)Running Go tests...$(RESET)"
	@go test -v -race -coverprofile=coverage.out ./...
	@echo "$(GREEN)Running WASM tests...$(RESET)"
	@cd $(WASM_DIR) && wasm-pack test --chrome --headless
	@echo "$(GREEN)All tests completed$(RESET)"

test-unit: ## Run unit tests only
	@echo "$(GREEN)Running unit tests...$(RESET)"
	@go test -v -short ./...

test-integration: ## Run integration tests
	@echo "$(GREEN)Running integration tests...$(RESET)"
	@go test -v -tags=integration ./tests/integration/...

test-coverage: ## Generate test coverage report
	@echo "$(GREEN)Generating coverage report...$(RESET)"
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Coverage report generated: coverage.html$(RESET)"

benchmark: ## Run benchmarks
	@echo "$(GREEN)Running benchmarks...$(RESET)"
	@go test -bench=. -benchmem ./...

## Security
security: security-scan security-audit security-deps ## Run all security checks

security-scan: ## Run security vulnerability scan
	@echo "$(GREEN)Running security scan...$(RESET)"
	@docker run --rm -v "$(PWD):/app" aquasec/trivy fs --exit-code 0 /app

security-audit: ## Run Go security audit
	@echo "$(GREEN)Running Go security audit...$(RESET)"
	@govulncheck ./...

security-deps: ## Check for vulnerable dependencies
	@echo "$(GREEN)Checking dependencies for vulnerabilities...$(RESET)"
	@nancy sleuth

security-secrets: ## Scan for secrets in code
	@echo "$(GREEN)Scanning for secrets...$(RESET)"
	@gitleaks detect --source . --verbose

## Code Quality
lint: ## Run linters
	@echo "$(GREEN)Running Go linters...$(RESET)"
	@golangci-lint run ./...
	@echo "$(GREEN)Running Rust linters...$(RESET)"
	@cd $(WASM_DIR) && cargo clippy -- -D warnings

format: ## Format code
	@echo "$(GREEN)Formatting Go code...$(RESET)"
	@gofmt -w $(GO_FILES)
	@goimports -w $(GO_FILES)
	@echo "$(GREEN)Formatting Rust code...$(RESET)"
	@cd $(WASM_DIR) && cargo fmt

check: lint test ## Run all checks (lint + test)

## Docker
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(RESET)"
	@docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD_TIME=$(BUILD_TIME) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		-t $(DOCKER_IMAGE):$(VERSION) \
		-t $(DOCKER_IMAGE):latest \
		-f dev/Dockerfile .
	@echo "$(GREEN)Docker image built: $(DOCKER_IMAGE):$(VERSION)$(RESET)"

docker-push: docker-build ## Push Docker image to registry
	@echo "$(GREEN)Pushing Docker image...$(RESET)"
	@docker push $(DOCKER_IMAGE):$(VERSION)
	@docker push $(DOCKER_IMAGE):latest
	@echo "$(GREEN)Docker image pushed$(RESET)"

docker-scan: docker-build ## Scan Docker image for vulnerabilities
	@echo "$(GREEN)Scanning Docker image...$(RESET)"
	@docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(DOCKER_IMAGE):$(VERSION)

## Database
db-migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(RESET)"
	@$(BUILD_DIR)/migrate up

db-rollback: ## Rollback database migrations
	@echo "$(YELLOW)Rolling back database migrations...$(RESET)"
	@$(BUILD_DIR)/migrate down

db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(RESET)"
	@$(BUILD_DIR)/migrate drop
	@$(BUILD_DIR)/migrate up

## Deployment
deploy-dev: docker-push ## Deploy to development environment
	@echo "$(GREEN)Deploying to development...$(RESET)"
	@helm upgrade --install adcf-dev deployments/helm \
		--namespace uars-adcf-dev \
		--create-namespace \
		--values deployments/helm/values-dev.yaml

deploy-staging: docker-push ## Deploy to staging environment
	@echo "$(GREEN)Deploying to staging...$(RESET)"
	@helm upgrade --install adcf-staging deployments/helm \
		--namespace uars-adcf-staging \
		--create-namespace \
		--values deployments/helm/values-staging.yaml

deploy-prod: docker-push ## Deploy to production environment
	@echo "$(RED)Deploying to production...$(RESET)"
	@echo "$(YELLOW)Are you sure? This will deploy to PRODUCTION! [y/N]$(RESET)"
	@read -r response && [ "$$response" = "y" ] || exit 1
	@helm upgrade --install adcf-prod deployments/helm \
		--namespace uars-adcf-prod \
		--create-namespace \
		--values deployments/helm/values-prod.yaml

## Monitoring
logs: ## View application logs
	@echo "$(GREEN)Viewing ADCF logs...$(RESET)"
	@kubectl logs -f deployment/adcf -n uars-adcf

metrics: ## Open metrics dashboard
	@echo "$(GREEN)Opening metrics dashboard...$(RESET)"
	@open http://localhost:3000/d/adcf/adcf-dashboard

## Maintenance
clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	@rm -rf $(BUILD_DIR)
	@rm -f coverage.out coverage.html
	@cd $(WASM_DIR) && cargo clean
	@docker system prune -f
	@echo "$(GREEN)Clean completed$(RESET)"

update-deps: ## Update dependencies
	@echo "$(GREEN)Updating Go dependencies...$(RESET)"
	@go get -u ./...
	@go mod tidy
	@echo "$(GREEN)Updating Rust dependencies...$(RESET)"
	@cd $(WASM_DIR) && cargo update

generate: ## Generate code
	@echo "$(GREEN)Generating code...$(RESET)"
	@go generate ./...

proto: ## Generate protobuf code
	@echo "$(GREEN)Generating protobuf code...$(RESET)"
	@protoc --go_out=. --go-grpc_out=. shared/proto/*.proto

## Documentation
docs: ## Generate documentation
	@echo "$(GREEN)Generating documentation...$(RESET)"
	@godoc -http=:6060 &
	@echo "$(GREEN)Documentation server started at http://localhost:6060$(RESET)"

docs-api: ## Generate API documentation
	@echo "$(GREEN)Generating API documentation...$(RESET)"
	@swagger generate spec -o docs/swagger.json

## Performance
profile: ## Run performance profiling
	@echo "$(GREEN)Starting performance profiling...$(RESET)"
	@go test -cpuprofile=cpu.prof -memprofile=mem.prof -bench=. ./...
	@echo "$(GREEN)Profiling completed. Use 'go tool pprof' to analyze$(RESET)"

load-test: ## Run load tests
	@echo "$(GREEN)Running load tests...$(RESET)"
	@docker-compose -f dev/docker-compose.yml --profile load-testing run --rm k6 run /scripts/load-test.js

## Utilities
version: ## Show version information
	@echo "$(CYAN)UARS ADCF Version Information$(RESET)"
	@echo "$(CYAN)=============================$(RESET)"
	@echo "Version:     $(VERSION)"
	@echo "Build Time:  $(BUILD_TIME)"
	@echo "Git Commit:  $(GIT_COMMIT)"
	@echo "Git Branch:  $(GIT_BRANCH)"

env: ## Show environment information
	@echo "$(CYAN)Environment Information$(RESET)"
	@echo "$(CYAN)======================$(RESET)"
	@echo "Go Version:    $$(go version)"
	@echo "Rust Version:  $$(rustc --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker:        $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Kubectl:       $$(kubectl version --client --short 2>/dev/null || echo 'Not installed')"
	@echo "Helm:          $$(helm version --short 2>/dev/null || echo 'Not installed')"

install-tools: ## Install development tools
	@echo "$(GREEN)Installing development tools...$(RESET)"
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install golang.org/x/tools/cmd/goimports@latest
	@go install golang.org/x/vuln/cmd/govulncheck@latest
	@curl -sSfL https://raw.githubusercontent.com/securecodewarrior/nancy/master/install.sh | sh
	@curl -sSfL https://raw.githubusercontent.com/zricethezav/gitleaks/master/scripts/install.sh | sh
	@curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
	@echo "$(GREEN)Development tools installed$(RESET)"

.PHONY: help dev dev-stop dev-logs deps wasm build build-race test test-unit test-integration \
        test-coverage benchmark security security-scan security-audit security-deps security-secrets \
        lint format check docker-build docker-push docker-scan db-migrate db-rollback db-reset \
        deploy-dev deploy-staging deploy-prod logs metrics clean update-deps generate proto docs \
        docs-api profile load-test version env install-tools
