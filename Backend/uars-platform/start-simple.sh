#!/bin/bash

# UARS-7 Backend Startup Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_DIR="/Users/chanduchitikam/uars7/Backend/uars-platform"
BIN_DIR="$BACKEND_DIR/bin"
LOG_DIR="$BACKEND_DIR/logs"

# Environment variables
export POSTGRES_DSN="postgres://postgres@localhost:5432/postgres?sslmode=disable"
export REDIS_URL="redis://localhost:6379"
export NATS_URL="nats://localhost:4222"
export LOG_LEVEL="info"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_port() {
    local port=$1
    if command -v nc >/dev/null 2>&1; then
        nc -z localhost $port 2>/dev/null
    else
        # Fallback method
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1
    fi
}

check_infrastructure() {
    log_info "Checking infrastructure services..."
    
    if ! check_port 5432; then
        log_error "PostgreSQL not running on port 5432"
        exit 1
    fi
    
    if ! check_port 6379; then
        log_error "Redis not running on port 6379"
        exit 1
    fi
    
    log_success "Infrastructure services are running"
}

build_services() {
    log_info "Building services..."
    cd "$BACKEND_DIR"
    
    mkdir -p "$BIN_DIR" "$LOG_DIR"
    
    # Build CADS
    if [ -d "services/cads/cmd/server" ]; then
        log_info "Building CADS..."
        cd services/cads
        go build -o ../../bin/cads ./cmd/server
        cd "$BACKEND_DIR"
        log_success "CADS built"
    fi
    
    # Build M-SES  
    if [ -d "services/m-ses/cmd/server" ]; then
        log_info "Building M-SES..."
        cd services/m-ses
        go build -o ../../bin/m-ses ./cmd/server
        cd "$BACKEND_DIR"
        log_success "M-SES built"
    fi
    
    # Build ADCF
    if [ -d "services/adcf/cmd/server" ]; then
        log_info "Building ADCF..."
        cd services/adcf
        go build -o ../../bin/adcf ./cmd/server
        cd "$BACKEND_DIR"
        log_success "ADCF built"
    fi
}

start_service() {
    local service=$1
    local port=$2
    
    log_info "Starting $service on port $port..."
    
    if [ ! -f "$BIN_DIR/$service" ]; then
        log_error "Binary for $service not found"
        return 1
    fi
    
    if check_port $port; then
        log_error "Port $port already in use"
        return 1
    fi
    
    # Set environment for service
    case $service in
        "cads")
            export HTTP_PORT=$port
            ;;
        "m-ses")
            export HTTP_PORT=$port
            ;;
        "adcf")
            export HTTP_PORT=$port
            ;;
    esac
    
    # Start service
    nohup "$BIN_DIR/$service" > "$LOG_DIR/$service.log" 2>&1 &
    local pid=$!
    echo $pid > "$LOG_DIR/$service.pid"
    
    sleep 3
    
    if kill -0 $pid 2>/dev/null; then
        log_success "$service started (PID: $pid)"
        return 0
    else
        log_error "$service failed to start"
        cat "$LOG_DIR/$service.log"
        return 1
    fi
}

stop_services() {
    log_info "Stopping services..."
    
    for service in cads m-ses adcf; do
        if [ -f "$LOG_DIR/$service.pid" ]; then
            local pid=$(cat "$LOG_DIR/$service.pid")
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                log_success "$service stopped"
            fi
            rm -f "$LOG_DIR/$service.pid"
        fi
    done
}

health_check() {
    log_info "Health checks..."
    
    # CADS
    if check_port 8082; then
        if curl -s http://localhost:8082/health >/dev/null; then
            log_success "CADS healthy"
        else
            log_error "CADS unhealthy"
        fi
    fi
    
    # M-SES
    if check_port 8081; then
        if curl -s http://localhost:8081/health >/dev/null; then
            log_success "M-SES healthy"
        else
            log_error "M-SES unhealthy"
        fi
    fi
    
    # ADCF
    if check_port 8083; then
        if curl -s http://localhost:8083/healthz >/dev/null; then
            log_success "ADCF healthy"
        else
            log_error "ADCF unhealthy"
        fi
    fi
}

show_dashboard() {
    echo -e "\n${GREEN}UARS-7 Backend Services:${NC}"
    echo -e "  CADS (Auth):      http://localhost:8082"
    echo -e "  M-SES (Security): http://localhost:8081"
    echo -e "  ADCF (Capsules):  http://localhost:8083"
    
    echo -e "\n${GREEN}Infrastructure:${NC}"
    echo -e "  PostgreSQL:       localhost:5432"
    echo -e "  Redis:            localhost:6379"
    echo -e "  Prometheus:       http://localhost:9090"
    echo -e "  Grafana:          http://localhost:3000"
    echo -e "  Jaeger:           http://localhost:16686"
    echo -e "  Adminer:          http://localhost:8080"
}

case "$1" in
    "start")
        log_info "Starting UARS-7 Backend..."
        check_infrastructure
        build_services
        
        start_service "cads" "8082"
        start_service "m-ses" "8081" 
        start_service "adcf" "8083"
        
        sleep 2
        health_check
        show_dashboard
        ;;
    
    "stop")
        stop_services
        ;;
    
    "health")
        health_check
        ;;
    
    "dashboard")
        show_dashboard
        ;;
    
    *)
        echo "Usage: $0 {start|stop|health|dashboard}"
        ;;
esac