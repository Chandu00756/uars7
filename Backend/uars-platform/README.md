# UARS-7 Backend Platform

> **Universal Adaptive Resilience System - Generation 7**  
> Microservices backend platform with military-grade security

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](../../LICENSE)
[![Security](https://img.shields.io/badge/Security-Military%20Grade-blue.svg)](../../SECURITY.md)

## 🏗️ Architecture Overview

The UARS-7 backend consists of 7 specialized microservices implementing a zero-trust architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway & Load Balancer                 │
├─────────────────────────────────────────────────────────────────┤
│                         Service Mesh                           │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│    CADS     │    M-SES    │    ADCF     │        SHEL         │
│  (Auth:82)  │  (Sec:81)   │  (Data:83)  │    (Hard:84)        │
├─────────────┼─────────────┼─────────────┼─────────────────────┤
│   ILECG     │    QVDM     │           TRDN                   │
│ (Life:85)   │  (Val:86)   │        (Trace:87)                │
├─────────────┴─────────────┴─────────────────────────────────────┤
│     Infrastructure (PostgreSQL, Redis, NATS, Prometheus)       │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Go** 1.21 or higher
- **Docker** and Docker Compose
- **PostgreSQL** 14+
- **Redis** 6+
- **NATS** 2.9+

### Start All Services

```bash
# Start infrastructure
make dev-up

# Build all services
make build-all

# Start backend services
./start-backend.sh start

# Check service status
./start-backend.sh status
```

### Individual Service Management

```bash
# Start specific service
./start-backend.sh start cads

# View service logs
./start-backend.sh logs cads

# Stop all services
./start-backend.sh stop
```

## 🎯 Services

### CADS - Centralized Authentication & Directory Service

**Port**: 8082  
**Purpose**: FIDO2/WebAuthn authentication and user management

#### Features
- 🔐 FIDO2/WebAuthn passwordless authentication
- 👤 User directory and profile management
- 🔑 Security key registration and validation
- 📱 Biometric authentication support
- 🔄 Session lifecycle management
- 📊 Authentication audit trails

#### API Endpoints
```bash
GET  /health                    # Health check
POST /auth/register/begin       # Start WebAuthn registration
POST /auth/register/finish      # Complete WebAuthn registration
POST /auth/login/begin          # Start WebAuthn login
POST /auth/login/finish         # Complete WebAuthn login
POST /auth/logout               # User logout
GET  /users/{id}                # Get user profile
PUT  /users/{id}                # Update user profile
```

### M-SES - Multi-Modal Security Enforcement Service

**Port**: 8081  
**Purpose**: Real-time security monitoring and enforcement

#### Features
- 🛡️ Real-time threat detection
- 🔍 Behavioral analytics
- ⚡ Incident response automation
- 📈 Security event correlation
- 🚨 Alert management
- 🔒 Policy enforcement

#### API Endpoints
```bash
GET  /health                    # Health check
GET  /security/events           # Get security events
POST /security/policies         # Create security policy
GET  /security/threats          # Get threat intelligence
POST /security/incidents        # Report security incident
```

### ADCF - Autonomous Data Capsule Fabric

**Port**: 8083  
**Purpose**: Military-grade data protection and encapsulation

#### Features
- 🛡️ Self-destructing data containers
- ⏱️ Time-based access controls
- 🌍 Geolocation restrictions
- 🔐 AES-256 encryption
- 📋 Policy-based governance
- 🔍 Access audit trails

#### API Endpoints
```bash
GET  /healthz                   # Health check
POST /capsules                  # Create data capsule
GET  /capsules/{id}             # Access data capsule
PUT  /capsules/{id}/policy      # Update capsule policy
DELETE /capsules/{id}           # Destroy capsule
GET  /capsules/{id}/audit       # Get access audit
```

### SHEL - Security Hardening & Enforcement Layer

**Port**: 8084  
**Purpose**: System hardening and security baseline enforcement

#### Features
- 🛠️ Automated security hardening
- 📊 Vulnerability assessments
- ✅ Compliance validation
- 🔧 Configuration management
- 🎯 Penetration testing integration
- 📈 Security metrics collection

### ILECG - Infrastructure Lifecycle & Governance

**Port**: 8085  
**Purpose**: Infrastructure automation and governance

#### Features
- 🏗️ Infrastructure as Code
- 🔄 Automated deployments
- 📊 Resource optimization
- 💰 Cost management
- 🌱 Environment provisioning
- 📈 Capacity planning

### QVDM - Quality Validation & Decision Making

**Port**: 8086  
**Purpose**: Automated quality assurance and decision support

#### Features
- 🧪 Automated testing
- 📊 Quality metrics
- ⚡ Performance validation
- 🤖 AI-powered decisions
- 📈 Predictive analytics
- 🎯 Risk assessment

### TRDN - Traceability & Dependency Network

**Port**: 8087  
**Purpose**: System traceability and dependency management

#### Features
- 🔗 Dependency mapping
- 📊 Impact analysis
- 🔍 Root cause analysis
- 📈 Change tracking
- 🎯 Compliance reporting
- 📊 Audit trail management

## 🛠️ Development

### Project Structure

```
Backend/uars-platform/
├── services/              # Microservices
│   ├── cads/             # Authentication service
│   ├── m-ses/            # Security service
│   ├── adcf/             # Data capsule service
│   ├── shel/             # Hardening service
│   ├── ilecg/            # Lifecycle service
│   ├── qvdm/             # Validation service
│   └── trdn/             # Traceability service
├── shared/               # Shared libraries
│   ├── auth/             # Authentication utilities
│   ├── config/           # Configuration management
│   ├── database/         # Database utilities
│   ├── middleware/       # HTTP middleware
│   └── proto/            # Protocol buffers
├── tools/                # CLI tools
│   └── uars-cli/         # Platform CLI
├── infrastructure/       # Deployment configs
│   ├── k8s/              # Kubernetes manifests
│   └── terraform/        # Terraform configs
├── monitoring/           # Monitoring configs
│   ├── prometheus/       # Prometheus config
│   └── grafana/          # Grafana dashboards
├── bin/                  # Compiled binaries
├── logs/                 # Service logs
└── docs/                 # Documentation
```

### Build Commands

```bash
# Build all services
make build-all

# Build specific service
cd services/cads && go build ./cmd/server

# Run tests
make test-all

# Run linting
make lint

# Generate API documentation
make docs

# Clean build artifacts
make clean
```

### Environment Variables

```bash
# Database
POSTGRES_DSN="postgres://user:pass@localhost:5432/uars7"
REDIS_URL="redis://localhost:6379"
NATS_URL="nats://localhost:4222"

# Security
JWT_SECRET="your-jwt-secret"
CORS_ORIGINS="http://localhost:5173"

# Monitoring
LOG_LEVEL="info"
METRICS_ENABLED="true"
```

## 🔒 Security

### Authentication Flow

1. **Registration**:
   ```
   Client → CADS: POST /auth/register/begin
   CADS → Client: WebAuthn challenge
   Client → CADS: POST /auth/register/finish (with attestation)
   CADS → Client: Registration success
   ```

2. **Login**:
   ```
   Client → CADS: POST /auth/login/begin
   CADS → Client: WebAuthn assertion options
   Client → CADS: POST /auth/login/finish (with assertion)
   CADS → Client: Authentication success + session
   ```

### Security Features

- **Zero-Trust Architecture**: Verify everything, trust nothing
- **End-to-End Encryption**: AES-256 for data at rest, TLS 1.3 in transit
- **Hardware Security**: FIDO2 security key support
- **Biometric Authentication**: Platform authenticator support
- **Session Management**: Secure session handling with rotation
- **Audit Logging**: Comprehensive security event logging

## 📊 Monitoring

### Metrics

All services expose metrics on `/metrics` endpoint:

- **HTTP Metrics**: Request count, duration, status codes
- **Database Metrics**: Connection pool, query performance
- **Custom Metrics**: Business KPIs, security events
- **System Metrics**: Memory, CPU, goroutines

### Health Checks

- **CADS**: `GET /health`
- **M-SES**: `GET /health`
- **ADCF**: `GET /healthz`
- **Others**: `GET /health`

### Logging

Structured JSON logging with correlation IDs:

```json
{
  "timestamp": "2025-01-01T12:00:00Z",
  "level": "info",
  "service": "cads",
  "correlation_id": "req-123-456",
  "message": "User authenticated successfully",
  "user_id": "user-789",
  "ip_address": "192.168.1.1"
}
```

## 🚀 Deployment

### Docker

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Scale services
docker-compose up --scale cads=3
```

### Kubernetes

```bash
# Apply manifests
kubectl apply -f infrastructure/k8s/

# Deploy with Helm
helm install uars7 ./infrastructure/helm/

# Check deployment
kubectl get pods -n uars7
```

### Production Checklist

- [ ] **Security**: Update all secrets and certificates
- [ ] **Database**: Configure production database with backups
- [ ] **Monitoring**: Set up alerts and dashboards
- [ ] **Logging**: Configure log aggregation
- [ ] **Scaling**: Configure auto-scaling policies
- [ ] **SSL/TLS**: Install valid certificates
- [ ] **Firewall**: Configure network security
- [ ] **Backup**: Set up regular backups

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

### Integration Tests

```bash
# Run integration tests
make test-integration

# Test specific service
cd services/cads && go test -tags=integration ./...
```

### Load Testing

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test CADS health endpoint
hey -n 1000 -c 10 http://localhost:8082/health

# Test authentication flow
./scripts/load-test-auth.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   ./start-backend.sh logs cads
   
   # Check dependencies
   ./start-backend.sh status
   
   # Restart service
   ./start-backend.sh restart cads
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql -h localhost -p 5432 -U uars7 -d uars7
   
   # Check database logs
   docker logs uars-platform_postgres_1
   ```

3. **Authentication Issues**
   ```bash
   # Check CADS logs
   tail -f logs/cads.log
   
   # Verify WebAuthn configuration
   curl http://localhost:8082/health
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Start service with debug
./bin/cads --debug

# Use Go debugger
go run -race ./cmd/server
```

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Architecture Guide](docs/architecture.md)
- [Security Guide](docs/security.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is proprietary software. See [LICENSE](../../LICENSE) for details.

---

**Built with ❤️ by the PortalVII team**
