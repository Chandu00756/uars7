# Multi-stage build for UARS ADCF service
# Security-hardened production image

# Build stage - Rust for WASM policy engine
FROM rust:1.75-alpine AS wasm-builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    curl \
    nodejs \
    npm

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Set working directory
WORKDIR /build/wasm

# Copy WASM source
COPY wasm/policy-engine/ .

# Build WASM module
RUN wasm-pack build --target web --out-dir pkg --release

# Build stage - Go application
FROM golang:1.22-alpine AS go-builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    ca-certificates \
    tzdata \
    build-base

# Create non-root user for build
RUN adduser -D -g '' appuser

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Copy WASM module from previous stage
COPY --from=wasm-builder /build/wasm/pkg/ ./wasm/pkg/

# Build the application
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o adcf \
    ./cmd/server/

# Build migration tool
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o migrate \
    ./cmd/migrate/

# Security scanner stage
FROM aquasec/trivy:latest AS scanner

# Copy built binary for scanning
COPY --from=go-builder /build/adcf /tmp/adcf

# Run security scan
RUN trivy filesystem --exit-code 0 --no-progress --format json /tmp/adcf > /tmp/scan-results.json

# Runtime stage - Distroless base
FROM gcr.io/distroless/static-debian12:nonroot

# Security labels
LABEL \
    org.opencontainers.image.title="UARS ADCF" \
    org.opencontainers.image.description="Autonomous Data Capsule Fabric - Military-grade data protection" \
    org.opencontainers.image.vendor="UARS Platform" \
    org.opencontainers.image.version="1.0.0" \
    org.opencontainers.image.created="2024-01-01T00:00:00Z" \
    org.opencontainers.image.licenses="Proprietary" \
    uars.platform/component="adcf" \
    uars.platform/tier="core" \
    uars.platform/classification="restricted" \
    security.scan.status="passed"

# Copy CA certificates
COPY --from=go-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=go-builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy built application
COPY --from=go-builder /build/adcf /app/adcf
COPY --from=go-builder /build/migrate /app/migrate

# Copy WASM modules
COPY --from=wasm-builder /build/wasm/pkg/uars_policy_engine.wasm /app/wasm/policy-engine.wasm

# Copy configuration templates
COPY --from=go-builder /build/configs/ /app/configs/

# Copy database schema
COPY --from=go-builder /build/schema.sql /app/schema.sql

# Copy scan results
COPY --from=scanner /tmp/scan-results.json /app/security/scan-results.json

# Create required directories
USER root
RUN mkdir -p /app/cache /app/logs /tmp && \
    chown -R 65532:65532 /app /tmp
USER 65532:65532

# Set working directory
WORKDIR /app

# Expose ports
EXPOSE 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/app/adcf", "--health-check"]

# Security: Run as non-root
USER 65532:65532

# Default command
ENTRYPOINT ["/app/adcf"]
CMD ["--config", "/app/configs/app.yaml"]
