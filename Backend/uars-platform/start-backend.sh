#!/bin/bash

# UARS-7 Backend Startup Script
# Comprehensive backend service orchestration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="/Users/chanduchitikam/uars7/Backend/uars-platform"
BIN_DIR="$BACKEND_DIR/bin"
LOG_DIR="$BACKEND_DIR/logs"

# Service configuration (simple arrays instead of associative)
SERVICES="cads m-ses adcf"
CADS_PORT="8082"
MSES_PORT="8081"
ADCF_PORT="8083"

# Environment variables
export POSTGRES_DSN="postgres://uars7:uars7_dev_password@localhost:5432/uars7?sslmode=disable"
export REDIS_URL="redis://localhost:6379"
export NATS_URL="nats://localhost:4222"
export LOG_LEVEL="info"

# Functions
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

check_dependency() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        log_success "$service is running on port $port"
        return 0
    else
        log_error "$service is not running on port $port"
        return 1
    fi
}

check_infrastructure() {
    log_info "Checking infrastructure services..."
    
    local deps_ok=true
    
    # Check PostgreSQL
    if ! check_dependency "PostgreSQL" 5432; then
        deps_ok=false
    fi
    
    # Check Redis
    if ! check_dependency "Redis" 6379; then
        deps_ok=false
    fi
    
    # Check NATS
    if ! check_dependency "NATS" 4222; then
        deps_ok=false
    fi
    
    # Check Prometheus
    if ! check_dependency "Prometheus" 9090; then
        deps_ok=false
    fi
    
    if [ "$deps_ok" = false ]; then
        log_error "Infrastructure dependencies not ready. Please run: make dev-up"
        exit 1
    fi
    
    log_success "All infrastructure services are running"
}

build_services() {
    log_info "Building all services..."
    
    cd "$BACKEND_DIR"
    
    # Create bin directory if it doesn't exist
    mkdir -p "$BIN_DIR"
    mkdir -p "$LOG_DIR"
    
    # Download dependencies
    log_info "Downloading Go dependencies..."
    go mod download
    go mod tidy
    
    # Build each service
    for service in "${!SERVICES[@]}"; do
        log_info "Building $service..."
        
        if [ -d "services/$service/cmd/server" ]; then
            cd "services/$service"
            if go build -o "../../bin/$service" ./cmd/server; then
                log_success "Built $service successfully"
            else
                log_error "Failed to build $service"
                exit 1
            fi
            cd "$BACKEND_DIR"
        else
            log_warning "Service $service not implemented yet (no cmd/server directory)"
        fi
    done
}

start_service() {
    local service=$1
    local port=${SERVICES[$service]}
    
    log_info "Starting $service on port $port..."
    
    # Check if service binary exists
    if [ ! -f "$BIN_DIR/$service" ]; then
        log_error "Binary for $service not found. Please build first."
        return 1
    fi
    
    # Check if port is already in use
    if nc -z localhost $port 2>/dev/null; then
        log_warning "$service port $port is already in use"
        return 1
    fi
    
    # Set service-specific environment variables
    case $service in
        "cads")
            export HTTP_PORT=$port
            ;;
        "m-ses")
            export HTTP_PORT=$port
            export GRPC_PORT=50052
            ;;
        "adcf")
            export HTTP_PORT=$port
            export RATE_LIMIT_RPS=100
            ;;
    esac
    
    # Start the service in background
    nohup "$BIN_DIR/$service" > "$LOG_DIR/$service.log" 2>&1 &
    local pid=$!
    
    # Save PID for later management
    echo $pid > "$LOG_DIR/$service.pid"
    
    # Wait a moment and check if service started successfully
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        log_success "$service started successfully (PID: $pid)"
        return 0
    else
        log_error "$service failed to start"
        return 1
    fi
}

stop_services() {
    log_info "Stopping all services..."
    
    for service in "${!SERVICES[@]}"; do
        local pid_file="$LOG_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            
            if kill -0 $pid 2>/dev/null; then
                log_info "Stopping $service (PID: $pid)..."
                kill $pid
                sleep 2
                
                # Force kill if still running
                if kill -0 $pid 2>/dev/null; then
                    log_warning "Force killing $service..."
                    kill -9 $pid
                fi
                
                log_success "$service stopped"
            else
                log_warning "$service was not running"
            fi
            
            rm -f "$pid_file"
        fi
    done
}

status_services() {
    log_info "Checking service status..."
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        local pid_file="$LOG_DIR/$service.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            
            if kill -0 $pid 2>/dev/null && nc -z localhost $port 2>/dev/null; then
                log_success "$service is running (PID: $pid, Port: $port)"
            else
                log_error "$service is not responding (PID: $pid, Port: $port)"
            fi
        else
            log_warning "$service is not started"
        fi
    done
}

show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        log_info "Available services: ${!SERVICES[*]}"
        return 1
    fi
    
    local log_file="$LOG_DIR/$service.log"
    
    if [ -f "$log_file" ]; then
        log_info "Showing logs for $service..."
        tail -f "$log_file"
    else
        log_error "Log file for $service not found"
        return 1
    fi
}

health_check() {
    log_info "Performing health checks..."
    
    for service in "${!SERVICES[@]}"; do
        local port=${SERVICES[$service]}
        local health_url="http://localhost:$port/health"
        
        log_info "Checking $service health..."
        
        if curl -s -f "$health_url" > /dev/null 2>&1; then
            log_success "$service health check passed"
        else
            log_error "$service health check failed"
        fi
    done
}

show_dashboard() {
    log_info "UARS-7 Backend Dashboard"
    echo -e "\n${GREEN}Service URLs:${NC}"
    echo -e "  CADS (Auth):     http://localhost:8082/health"
    echo -e "  M-SES (Security): http://localhost:8081/health"
    echo -e "  ADCF (Capsules): http://localhost:8083/healthz"
    
    echo -e "\n${GREEN}Infrastructure URLs:${NC}"
    echo -e "  PostgreSQL:      localhost:5432 (uars7/uars7_dev_password)"
    echo -e "  Redis:           localhost:6379"
    echo -e "  NATS:            localhost:4222"
    echo -e "  Prometheus:      http://localhost:9090"
    echo -e "  Grafana:         http://localhost:3000 (admin/admin)"
    echo -e "  Jaeger:          http://localhost:16686"
    echo -e "  Adminer:         http://localhost:8080"
    
    echo -e "\n${GREEN}Frontend:${NC}"
    echo -e "  React App:       http://localhost:5173"
}

# Main script logic
case "$1" in
    "start")
        log_info "Starting UARS-7 Backend..."
        check_infrastructure
        build_services
        
        for service in "${!SERVICES[@]}"; do
            start_service "$service"
        done
        
        sleep 3
        health_check
        show_dashboard
        ;;
    
    "stop")
        stop_services
        ;;
    
    "restart")
        stop_services
        sleep 2
        "$0" start
        ;;
    
    "status")
        status_services
        ;;
    
    "logs")
        show_logs "$2"
        ;;
    
    "health")
        health_check
        ;;
    
    "dashboard")
        show_dashboard
        ;;
    
    "build")
        build_services
        ;;
    
    *)
        echo -e "${BLUE}UARS-7 Backend Management Script${NC}"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|health|dashboard|build}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all backend services"
        echo "  stop      - Stop all backend services"
        echo "  restart   - Restart all backend services"
        echo "  status    - Show service status"
        echo "  logs      - Show logs for a specific service"
        echo "  health    - Perform health checks"
        echo "  dashboard - Show service URLs and info"
        echo "  build     - Build all services"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs cads"
        echo "  $0 status"
        ;;
esac