#!/bin/bash

# UARS-7 Development Environment Setup Script
# This script sets up the complete development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    # Check Docker Compose
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    # Check Go
    if ! command_exists go; then
        missing_deps+=("Go (1.21+)")
    else
        local go_version
        go_version=$(go version | awk '{print $3}' | sed 's/go//')
        if [[ "$go_version" < "1.21" ]]; then
            log_warning "Go version $go_version detected. Version 1.21+ recommended."
        fi
    fi
    
    # Check Node.js
    if ! command_exists node; then
        missing_deps+=("Node.js (18+)")
    else
        local node_version
        node_version=$(node --version | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        if [[ "$major_version" -lt 18 ]]; then
            log_warning "Node.js version $node_version detected. Version 18+ recommended."
        fi
    fi
    
    # Check npm
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    # Check Make
    if ! command_exists make; then
        missing_deps+=("Make")
    fi
    
    # Check Git
    if ! command_exists git; then
        missing_deps+=("Git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    local hooks_dir=".git/hooks"
    
    # Pre-commit hook
    cat > "$hooks_dir/pre-commit" << 'EOF'
#!/bin/bash

# UARS-7 Pre-commit Hook
# Runs formatting, linting, and basic tests before commit

set -e

echo "Running pre-commit checks..."

# Check Go formatting
if command -v go >/dev/null 2>&1; then
    echo "Checking Go formatting..."
    unformatted=$(find . -name "*.go" -not -path "./vendor/*" -exec gofmt -l {} +)
    if [ -n "$unformatted" ]; then
        echo "The following Go files are not formatted:"
        echo "$unformatted"
        echo "Please run 'go fmt ./...' to fix formatting."
        exit 1
    fi
fi

# Check for secrets
echo "Checking for secrets..."
if git diff --cached --name-only | xargs grep -l "password\|secret\|key\|token" >/dev/null 2>&1; then
    echo "Warning: Potential secrets detected in staged files."
    echo "Please review your changes carefully."
fi

echo "Pre-commit checks passed!"
EOF
    
    chmod +x "$hooks_dir/pre-commit"
    
    log_success "Git hooks configured"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Backend environment
    local backend_env="Backend/uars-platform/.env.local"
    if [ ! -f "$backend_env" ]; then
        cat > "$backend_env" << 'EOF'
# UARS-7 Backend Development Environment

# Database Configuration
POSTGRES_DSN=postgres://uars7:uars7_dev_password@localhost:5432/uars7?sslmode=disable
REDIS_URL=redis://localhost:6379
NATS_URL=nats://localhost:4222

# Security Configuration
JWT_SECRET=dev-jwt-secret-change-in-production
CORS_ORIGINS=http://localhost:5173

# Service Configuration
LOG_LEVEL=debug
METRICS_ENABLED=true
DEBUG_MODE=true

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_ORIGIN=http://localhost:5173
WEBAUTHN_RP_NAME=UARS-7 Development
EOF
        log_success "Created backend environment file"
    else
        log_info "Backend environment file already exists"
    fi
    
    # Frontend environment
    local frontend_env="uars7-frontend/.env.local"
    if [ ! -f "$frontend_env" ]; then
        cat > "$frontend_env" << 'EOF'
# UARS-7 Frontend Development Environment

# API Configuration
VITE_API_URL=http://localhost:8082
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug

# Feature Flags
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_MOCK_DATA=false

# WebAuthn Configuration
VITE_WEBAUTHN_TIMEOUT=60000
VITE_WEBAUTHN_USER_VERIFICATION=preferred
EOF
        log_success "Created frontend environment file"
    else
        log_info "Frontend environment file already exists"
    fi
}

# Setup development tools
setup_dev_tools() {
    log_info "Setting up development tools..."
    
    # Install Go tools
    if command_exists go; then
        log_info "Installing Go development tools..."
        go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
        go install golang.org/x/tools/cmd/goimports@latest
        go install github.com/swaggo/swag/cmd/swag@latest
        log_success "Go tools installed"
    fi
    
    # Install Node.js global tools
    if command_exists npm; then
        log_info "Installing Node.js development tools..."
        npm install -g @typescript-eslint/eslint-plugin
        npm install -g prettier
        npm install -g typescript
        log_success "Node.js tools installed"
    fi
}

# Setup IDE configuration
setup_ide_config() {
    log_info "Setting up IDE configuration..."
    
    # VSCode settings
    mkdir -p .vscode
    
    # VSCode settings.json
    cat > .vscode/settings.json << 'EOF'
{
  "go.formatTool": "goimports",
  "go.lintTool": "golangci-lint",
  "go.testFlags": ["-v", "-race"],
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/bin": true,
    "**/logs": true,
    "**/*.log": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bin": true,
    "**/logs": true,
    "**/vendor": true
  }
}
EOF
    
    # VSCode launch.json for debugging
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CADS Service",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}/Backend/uars-platform/services/cads/cmd/server",
      "cwd": "${workspaceFolder}/Backend/uars-platform",
      "env": {
        "POSTGRES_DSN": "postgres://uars7:uars7_dev_password@localhost:5432/uars7?sslmode=disable",
        "LOG_LEVEL": "debug"
      }
    },
    {
      "name": "Debug M-SES Service",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}/Backend/uars-platform/services/m-ses/cmd/server",
      "cwd": "${workspaceFolder}/Backend/uars-platform"
    }
  ]
}
EOF
    
    # VSCode tasks.json
    cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start UARS-7 Development",
      "type": "shell",
      "command": "./start-application.sh",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "Build Backend Services",
      "type": "shell",
      "command": "make build-all",
      "options": {
        "cwd": "${workspaceFolder}/Backend/uars-platform"
      },
      "group": "build",
      "problemMatcher": "$go"
    },
    {
      "label": "Test Backend Services",
      "type": "shell",
      "command": "make test-all",
      "options": {
        "cwd": "${workspaceFolder}/Backend/uars-platform"
      },
      "group": "test",
      "problemMatcher": "$go"
    },
    {
      "label": "Start Frontend Development",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/uars7-frontend"
      },
      "group": "build",
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^([^\\s].*)\\((\\d+),(\\d+)\\):\\s+(warning|error):\\s+(.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "message": 5
        }
      }
    }
  ]
}
EOF
    
    log_success "IDE configuration created"
}

# Main setup function
main() {
    log_info "Starting UARS-7 development environment setup..."
    
    check_prerequisites
    setup_git_hooks
    setup_environment
    setup_dev_tools
    setup_ide_config
    
    log_success "Development environment setup completed!"
    
    echo ""
    echo "Next steps:"
    echo "1. Start the development environment: ./start-application.sh"
    echo "2. Open the project in your IDE (VSCode recommended)"
    echo "3. Visit http://localhost:5173 to access the application"
    echo "4. Read the documentation in docs/ directory"
    echo ""
    echo "Happy coding! 🚀"
}

# Run main function
main "$@"
