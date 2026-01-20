# Multi-stage Dockerfile for Arc Zero API (Rust Backend)
# Stage 1: Build
FROM rust:1.88-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/archzero-api

# Copy Cargo files
COPY Cargo.toml ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > src/lib.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src
COPY migrations ./migrations

# Build the actual application
RUN touch src/main.rs && cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Create non-root user
RUN useradd -m -u 1000 archzero

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/archzero-api/target/release/archzero-api /app/archzero-api

# Copy migrations
COPY --from=builder /usr/src/archzero-api/migrations ./migrations

# Copy migration runner script
COPY --chown=archzero:archzero run-migrations.sh ./run-migrations.sh

# Change ownership to archzero user
RUN chown -R archzero:archzero /app && \
    chmod +x ./run-migrations.sh

# Switch to non-root user
USER archzero

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

# Run the application with migrations
CMD ["sh", "-c", "./run-migrations.sh && ./archzero-api"]
