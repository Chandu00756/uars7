#!/bin/bash

# UARS-7 Complete Application Startup Script
# Zero-error production startup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
BACKEND_DIR="/Users/chanduchitikam/uars7/Backend/uars-platform"
FRONTEND_DIR="/Users/chanduchitikam/uars7/uars7-frontend"
BIN_DIR="$BACKEND_DIR/bin"
LOG_DIR="$BACKEND_DIR/logs"

# Create directories
mkdir -p "$LOG_DIR"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}═══════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════${NC}\n"
}

wait_for_port() {
    local port=$1
    local service=$2
    local timeout=30
    local count=0
    
    while ! nc -z localhost $port 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            log_error "$service failed to start on port $port after ${timeout}s"
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
    return 0
}

check_infrastructure() {
    log_info "Checking infrastructure services..."
    
    local services=(
        "5432:PostgreSQL"
        "6379:Redis"
        "4222:NATS"
        "9090:Prometheus"
        "3000:Grafana"
        "16686:Jaeger"
        "8080:Adminer"
    )
    
    for service in "${services[@]}"; do
        local port="${service%%:*}"
        local name="${service##*:}"
        
        if wait_for_port $port $name; then
            log_success "$name is ready on port $port"
        else
            log_error "$name is not ready on port $port"
            return 1
        fi
    done
}

build_backend() {
    log_info "Building backend services..."
    cd "$BACKEND_DIR"
    
    # Download dependencies
    go mod download
    go mod tidy
    
    # Build services
    local services=("cads" "m-ses" "adcf")
    
    for service in "${services[@]}"; do
        if [ -d "services/$service/cmd/server" ]; then
            log_info "Building $service..."
            cd "services/$service"
            if go build -o "../../bin/$service" ./cmd/server; then
                log_success "$service built successfully"
            else
                log_error "Failed to build $service"
                return 1
            fi
            cd "$BACKEND_DIR"
        fi
    done
}

start_backend_service() {
    local service=$1
    local port=$2
    local additional_env="$3"
    
    log_info "Starting $service on port $port..."
    
    # Set common environment
    export POSTGRES_DSN="postgres://postgres@localhost:5432/postgres?sslmode=disable"
    export REDIS_URL="redis://localhost:6379"
    export NATS_URL="nats://localhost:4222"
    export HTTP_PORT=$port
    
    # Set additional environment if provided
    if [ -n "$additional_env" ]; then
        eval "export $additional_env"
    fi
    
    # Start service
    nohup "$BIN_DIR/$service" > "$LOG_DIR/$service.log" 2>&1 &
    local pid=$!
    echo $pid > "$LOG_DIR/$service.pid"
    
    # Wait for service to start
    if wait_for_port $port $service; then
        log_success "$service started successfully (PID: $pid)"
        return 0
    else
        log_error "$service failed to start on port $port"
        if [ -f "$LOG_DIR/$service.log" ]; then
            echo "Last 10 lines of $service log:"
            tail -10 "$LOG_DIR/$service.log"
        fi
        return 1
    fi
}

start_backend() {
    log_info "Starting backend services..."
    
    # Start CADS (Authentication)
    start_backend_service "cads" "8082" ""
    
    # Start M-SES (Security)
    start_backend_service "m-ses" "8081" "GRPC_PORT=50052"
    
    # Start ADCF (Data Capsules)
    start_backend_service "adcf" "8083" "RATE_LIMIT_RPS=100"
}

health_check_backend() {
    log_info "Performing backend health checks..."
    
    local checks=(
        "8082:/health:CADS"
        "8081:/health:M-SES"
        "8083:/healthz:ADCF"
    )
    
    for check in "${checks[@]}"; do
        local port="${check%%:*}"
        local path="${check#*:}"
        path="${path%:*}"
        local name="${check##*:}"
        
        local url="http://localhost:$port$path"
        
        if curl -s -f "$url" >/dev/null 2>&1; then
            log_success "$name health check passed"
        else
            log_warning "$name health check failed - checking if service is running..."
            if nc -z localhost $port 2>/dev/null; then
                log_warning "$name is running but health endpoint may not be ready yet"
            else
                log_error "$name is not running on port $port"
            fi
        fi
    done
}

setup_frontend() {
    log_info "Setting up frontend..."
    cd "$FRONTEND_DIR"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
    fi
    
    log_success "Frontend setup complete"
}

start_frontend() {
    log_info "Starting frontend on port 5173..."
    cd "$FRONTEND_DIR"
    
    # Start Vite dev server in background
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$LOG_DIR/frontend.pid"
    
    # Wait for frontend to start
    if wait_for_port 5173 "Frontend"; then
        log_success "Frontend started successfully (PID: $pid)"
        return 0
    else
        log_error "Frontend failed to start"
        return 1
    fi
}

show_dashboard() {
    log_header "UARS-7 APPLICATION SUCCESSFULLY STARTED!"
    
    echo -e "${GREEN}🚀 Frontend Application:${NC}"
    echo -e "   Portal VII UI:        http://localhost:5173"
    echo -e "   Login Page:           http://localhost:5173/login"
    
    echo -e "\n${GREEN}🔧 Backend Services:${NC}"
    echo -e "   CADS (Auth):          http://localhost:8082/health"
    echo -e "   M-SES (Security):     http://localhost:8081/health"
    echo -e "   ADCF (Capsules):      http://localhost:8083/healthz"
    
    echo -e "\n${GREEN}📊 Infrastructure & Monitoring:${NC}"
    echo -e "   PostgreSQL:           localhost:5432"
    echo -e "   Redis:                localhost:6379"
    echo -e "   NATS:                 localhost:4222"
    echo -e "   Prometheus:           http://localhost:9090"
    echo -e "   Grafana:              http://localhost:3000 (admin/admin)"
    echo -e "   Jaeger Tracing:       http://localhost:16686"
    echo -e "   Database Admin:       http://localhost:8080"
    
    echo -e "\n${GREEN}🔐 Authentication Flow:${NC}"
    echo -e "   • Passwordless WebAuthn authentication"
    echo -e "   • Security key support"
    echo -e "   • FIDO2 compliance"
    echo -e "   • JWT session management"
    
    echo -e "\n${YELLOW}📝 Logs Location:${NC}"
    echo -e "   Backend logs:         $LOG_DIR/"
    echo -e "   Frontend logs:        $LOG_DIR/frontend.log"
    
    echo -e "\n${BLUE}💡 Next Steps:${NC}"
    echo -e "   1. Open http://localhost:5173 in your browser"
    echo -e "   2. Try the passwordless authentication"
    echo -e "   3. Monitor services via Grafana dashboard"
    echo -e "\n${PURPLE}═══════════════════════════════════════${NC}"
}

cleanup_on_exit() {
    log_info "Cleaning up..."
    
    # Kill backend services
    for service in cads m-ses adcf; do
        if [ -f "$LOG_DIR/$service.pid" ]; then
            local pid=$(cat "$LOG_DIR/$service.pid" 2>/dev/null || echo "")
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$LOG_DIR/$service.pid"
        fi
    done
    
    # Kill frontend
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        local pid=$(cat "$LOG_DIR/frontend.pid" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$LOG_DIR/frontend.pid"
    fi
}

# Trap cleanup on exit
trap cleanup_on_exit EXIT

# Main execution
main() {
    log_header "STARTING UARS-7 COMPLETE APPLICATION STACK"
    
    # Step 1: Check infrastructure
    if ! check_infrastructure; then
        log_error "Infrastructure check failed"
        exit 1
    fi
    
    # Step 2: Build backend
    if ! build_backend; then
        log_error "Backend build failed"
        exit 1
    fi
    
    # Step 3: Start backend services
    if ! start_backend; then
        log_error "Backend startup failed"
        exit 1
    fi
    
    # Step 4: Health check backend
    sleep 5  # Give services time to fully initialize
    health_check_backend
    
    # Step 5: Setup frontend
    if ! setup_frontend; then
        log_error "Frontend setup failed"
        exit 1
    fi
    
    # Step 6: Start frontend
    if ! start_frontend; then
        log_error "Frontend startup failed"
        exit 1
    fi
    
    # Step 7: Show dashboard
    show_dashboard
    
    # Keep script running
    log_info "All services are running. Press Ctrl+C to stop all services."
    while true; do
        sleep 10
        
        # Basic health monitoring
        if ! nc -z localhost 5173 2>/dev/null; then
            log_warning "Frontend seems to be down"
        fi
        
        local backend_down=0
        for port in 8082 8081 8083; do
            if ! nc -z localhost $port 2>/dev/null; then
                backend_down=1
                break
            fi
        done
        
        if [ $backend_down -eq 1 ]; then
            log_warning "Some backend services may be down"
        fi
    done
}

# Run main function
main