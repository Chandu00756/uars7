#!/bin/bash

# UARS7 Platform Startup Script
# This script starts all components of the UARS7 platform including:
# - Infrastructure services (PostgreSQL, Redis, NATS, etc.)
# - Backend Go microservices
# - Frontend React application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $max_attempts seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down services..."
    
    # Kill background processes
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping frontend server..."
        kill $FRONTEND_PID
    fi
    
    # Kill backend services
    for service in cads m-ses shel ilecg qvdm trdn adcf; do
        pkill -f "bin/$service" 2>/dev/null || true
    done
    
    # Stop docker services - make sure we're in the right directory
    if [ -d "Backend/uars-platform" ]; then
        print_status "Stopping infrastructure services..."
        cd Backend/uars-platform
        make dev-down 2>/dev/null || true
        cd ../..
    else
        print_warning "Backend/uars-platform directory not found, skipping Docker cleanup"
    fi
    
    print_success "Cleanup completed"
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Main startup function
main() {
    print_status "Starting UARS7 Platform..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker ps >/dev/null 2>&1; then
        print_warning "Docker daemon is not running. Please start Docker Desktop and wait a moment..."
        print_status "Waiting for Docker daemon to start..."
        
        # Wait for Docker to be ready
        local max_wait=60
        local wait_time=0
        while [ $wait_time -lt $max_wait ]; do
            if docker ps >/dev/null 2>&1; then
                print_success "Docker daemon is now running"
                break
            fi
            echo -n "."
            sleep 2
            wait_time=$((wait_time + 2))
        done
        
        if [ $wait_time -ge $max_wait ]; then
            print_error "Docker daemon failed to start within $max_wait seconds"
            print_error "Please start Docker Desktop manually and try again"
            exit 1
        fi
    fi
    
    if ! command_exists go; then
        print_error "Go is required but not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    if ! command_exists nc; then
        print_warning "netcat (nc) is not available, skipping service readiness checks"
    fi
    
    print_success "Prerequisites check completed"
    
    # Ensure we're in the correct directory
    if [ ! -d "Backend/uars-platform" ] || [ ! -d "uars7-frontend" ]; then
        print_error "Please run this script from the UARS7 project root directory"
        print_error "Expected directories: Backend/uars-platform and uars7-frontend"
        exit 1
    fi
    
    # Step 1: Start infrastructure services
    print_status "Starting infrastructure services..."
    cd Backend/uars-platform
    
    # Clean up any existing containers
    make dev-down 2>/dev/null || true
    
    # Start infrastructure
    make dev-up
    cd ../..
    
    # Wait for key services to be ready
    if command_exists nc; then
        wait_for_service "PostgreSQL" 5432
        wait_for_service "Redis" 6379
        wait_for_service "NATS" 4222
        wait_for_service "Prometheus" 9090
        wait_for_service "Grafana" 3000
    else
        print_status "Waiting 30 seconds for infrastructure services to start..."
        sleep 30
    fi
    
    # Step 2: Build and start backend services
    print_status "Building backend services..."
    cd Backend/uars-platform
    
    # Install Go dependencies
    print_status "Installing Go dependencies..."
    make deps
    
    # Build all services
    print_status "Building all Go services..."
    make build-all
    
    # Create logs directory
    mkdir -p logs
    
    # Start each service in background
    services=(cads m-ses shel ilecg qvdm trdn adcf)
    for service in "${services[@]}"; do
        if [ -f "bin/$service" ]; then
            print_status "Starting $service service..."
            nohup ./bin/$service > logs/$service.log 2>&1 &
            sleep 2  # Give service time to start
        else
            print_warning "Service binary bin/$service not found, skipping..."
        fi
    done
    
    cd ../..
    
    # Step 3: Start frontend development server
    print_status "Setting up frontend..."
    cd uars7-frontend
    
    # Install npm dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing npm dependencies..."
        npm install
    fi
    
    # Start frontend development server
    print_status "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    
    # Wait a moment for frontend to start
    sleep 5
    
    # Display service status
    echo ""
    print_success "🚀 UARS7 Platform started successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "  🌐 Frontend:          http://localhost:5173"
    echo "  🗄️  PostgreSQL:        localhost:5432 (user: uars7, db: uars7)"
    echo "  🔴 Redis:             localhost:6379"
    echo "  📨 NATS:              localhost:4222"
    echo "  📊 Prometheus:        http://localhost:9090"
    echo "  📈 Grafana:           http://localhost:3000 (admin/admin)"
    echo "  🔍 Jaeger:            http://localhost:16686"
    echo "  🗃️  Adminer:           http://localhost:8080"
    echo ""
    echo "📁 Log files:"
    for service in cads m-ses shel ilecg qvdm trdn adcf; do
        if [ -f "Backend/uars-platform/logs/$service.log" ]; then
            echo "  📄 $service: Backend/uars-platform/logs/$service.log"
        fi
    done
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    echo ""
    
    # Keep script running until interrupted
    wait $FRONTEND_PID
}

# Run main function
main "$@"