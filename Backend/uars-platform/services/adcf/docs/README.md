# ADCF (Autonomous Data Capsule Fabric) Service

**Status**: Production Ready | **Version**: 1.0.0 | **Security Level**: Military Grade

## Overview

The Autonomous Data Capsule Fabric (ADCF) is a critical component of the U-ARS 7 platform that provides military-grade data encapsulation, encryption, and policy-driven access control. ADCF ensures data sovereignty, compliance, and secure data lifecycle management through advanced cryptographic techniques and intelligent policy enforcement.

## Features

### 🔐 Military-Grade Security
- **Dual Encryption**: AES-256-GCM and ChaCha20-Poly1305 algorithms
- **Digital Signatures**: Ed25519 cryptographic signatures
- **Key Derivation**: Scrypt-based secure key generation
- **Secure Memory**: Automatic secure memory cleanup
- **Device Attestation**: Hardware-based device verification

### 📋 Policy Engine
- **WASM-based Policies**: High-performance policy execution
- **Dynamic Evaluation**: Real-time policy assessment
- **Context-aware Access**: Situational access control
- **Schema Validation**: JSON-LD schema enforcement
- **Version Control**: Policy versioning and rollback

### 📊 Comprehensive Monitoring
- **Real-time Telemetry**: Custom metrics collection
- **Audit Logging**: Immutable audit trail
- **Performance Metrics**: System health monitoring
- **Security Events**: Threat detection and alerting
- **Prometheus Compatible**: Standard metrics format

### 🌐 API Interfaces
- **REST API**: Full CRUD operations with OpenAPI 3.0 spec
- **GraphQL API**: Flexible querying and real-time subscriptions
- **WebSocket**: Real-time event streaming
- **gRPC**: High-performance service communication

## Quick Start

### Prerequisites
- Go 1.22+
- PostgreSQL 16+
- Docker (optional)

### Installation

1. **Clone and Setup**
```bash
cd services/adcf
go mod download
```

2. **Database Setup**
```bash
# Create database
createdb uars_adcf

# Apply schema
psql -d uars_adcf -f dev/schema.sql
```

3. **Environment Configuration**
```bash
cp dev/.env.example .env
# Edit .env with your configuration
```

4. **Run Service**
```bash
go run cmd/server/main.go
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | HTTP server port | `8080` | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `ENCRYPTION_KEY` | Master encryption key | - | Yes |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` | No |
| `ENVIRONMENT` | Deployment environment | `development` | No |

### Database Configuration

The service requires PostgreSQL 16+ with the following extensions:
- `pgcrypto` - Cryptographic functions
- `uuid-ossp` - UUID generation

## API Documentation

### REST API
- **Base URL**: `http://localhost:8080/api/v1`
- **OpenAPI Spec**: Available at `/docs/adc-api.yaml`
- **Interactive Docs**: Available at `/swagger/` (when enabled)

### GraphQL API
- **Endpoint**: `http://localhost:8080/graphql`
- **Schema**: Available at `/docs/gql-schema.graphql`
- **Playground**: Available at `/graphql` (development only)

### Key Endpoints

#### Capsules
- `POST /api/v1/capsules` - Create capsule
- `GET /api/v1/capsules/{id}` - Get capsule
- `POST /api/v1/capsules/{id}/access` - Access capsule data
- `DELETE /api/v1/capsules/{id}/revoke` - Revoke capsule

#### Policies
- `POST /api/v1/policies` - Create policy
- `GET /api/v1/policies` - List policies
- `PUT /api/v1/policies/{id}` - Update policy
- `POST /api/v1/policies/validate` - Validate policy

#### Audit
- `GET /api/v1/audit` - Get audit logs
- `GET /api/v1/audit/export` - Export audit data

## Security Features

### Encryption
```go
// Dual encryption support
type EncryptionConfig struct {
    Algorithm string // "aes-256-gcm" or "chacha20-poly1305"
    KeySize   int    // 32 bytes for both algorithms
}
```

### Access Control
- **Intent Tokens**: Cryptographically signed access intentions
- **Device Attestation**: Hardware-based device verification
- **Context Evaluation**: Dynamic access policies
- **Rate Limiting**: Request throttling and abuse prevention

### Audit Trail
- **Immutable Logs**: Cryptographically secured audit entries
- **Complete Coverage**: All operations logged
- **Retention Policies**: Configurable log retention
- **Export Capabilities**: Compliance reporting

## Architecture

### Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │    │   GraphQL API   │    │   gRPC API      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                           │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│  Capsule Mgr    │  Policy Engine  │  Crypto Service │  Ledger   │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                     Storage Layer                              │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   PostgreSQL    │   File Storage  │   Audit Logs    │  Metrics  │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
```

### Data Flow

1. **Request Authentication**: JWT validation and intent verification
2. **Policy Evaluation**: WASM-based policy execution
3. **Cryptographic Operations**: Encryption/decryption with dual algorithms
4. **Audit Logging**: Immutable audit trail recording
5. **Response Generation**: Secure data formatting and delivery

## Development

### Project Structure
```
services/adcf/
├── cmd/server/           # Main application entry
├── internal/             # Internal packages
│   ├── api/             # REST and GraphQL handlers
│   ├── capsules/        # Capsule management
│   ├── crypto/          # Cryptographic operations
│   ├── ledger/          # Audit logging
│   ├── policy/          # Policy engine
│   └── telemetry/       # Metrics and monitoring
├── wasm/                # WASM policy modules
├── docs/                # API documentation
├── deployments/         # Deployment configurations
└── dev/                 # Development utilities
```

### Building

```bash
# Build binary
go build -o bin/adcf cmd/server/main.go

# Build Docker image
docker build -t uars/adcf:latest .

# Run tests
go test ./...
```

### Testing

```bash
# Unit tests
go test -v ./internal/...

# Integration tests
go test -v -tags=integration ./tests/...

# Security tests
go test -v -tags=security ./tests/security/...
```

## Deployment

### Docker
```bash
docker run -d \
  --name adcf-service \
  -p 8080:8080 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=your-secret \
  uars/adcf:latest
```

### Kubernetes
```bash
# Apply configurations
kubectl apply -f deployments/k8s/

# Check status
kubectl get pods -l app=adcf
```

### Helm
```bash
# Install chart
helm install adcf deployments/helm/adcf/

# Upgrade
helm upgrade adcf deployments/helm/adcf/
```

## Monitoring

### Health Checks
- `/health` - Basic health endpoint
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### Metrics
- `/metrics` - Prometheus-compatible metrics
- Custom metrics for capsule operations
- Performance and security metrics

### Logging
- Structured JSON logging with zerolog
- Configurable log levels
- Correlation IDs for request tracing

## Security Considerations

### Production Deployment
1. **TLS Configuration**: Always use TLS 1.3+ in production
2. **Key Management**: Use proper key rotation and HSM integration
3. **Network Security**: Deploy within secured network perimeters
4. **Access Control**: Implement proper RBAC and network policies
5. **Monitoring**: Enable comprehensive security monitoring

### Compliance
- **NIST Standards**: Follows NIST cryptographic guidelines
- **FIPS 140-2**: Compatible with FIPS-approved algorithms
- **Zero Trust**: Implements zero-trust security principles
- **Audit Requirements**: Comprehensive audit logging for compliance

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT version();"
   ```

2. **Permission Errors**
   ```bash
   # Verify database permissions
   psql $DATABASE_URL -c "SELECT current_user, current_database();"
   ```

3. **Encryption Errors**
   ```bash
   # Verify encryption key format
   echo $ENCRYPTION_KEY | base64 -d | wc -c  # Should be 32 bytes
   ```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
go run cmd/server/main.go
```

## Contributing

1. **Code Standards**: Follow Go coding conventions
2. **Security Review**: All changes require security review
3. **Testing**: Maintain >90% test coverage
4. **Documentation**: Update docs for API changes

## Support

For technical support and security issues:
- **Security Issues**: Report immediately to security team
- **Bug Reports**: Use issue tracking system
- **Feature Requests**: Submit through proper channels

---

**⚠️ SECURITY NOTICE**: This system handles sensitive data with military-grade encryption. Follow all security protocols and never expose cryptographic keys or sensitive configuration data.
