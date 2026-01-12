---

# Appendix H: Deployment Guide

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Target Audience:** DevOps Engineers, System Administrators

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Requirements](#2-system-requirements)
3. [Environment Variables](#3-environment-variables)
4. [Production Deployment](#4-production-deployment)
5. [Database Setup](#5-database-setup)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Backup & Recovery](#7-backup--recovery)
8. [Security Hardening](#8-security-hardening)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

Arc Zero uses a **multi-tier architecture**:

```
┌─────────────────┐
│   Load Balancer │  (Nginx, AWS ALB, Cloudflare)
└────────┬────────┘
         │
    ┌────┴────┐
    │ Frontend│  (Static files: React SPA)
    │ (CDN)   │
    └─────────┘
         │
    ┌────┴────┐
    │ Backend │  (Rust API, Axum framework)
    │ (Stateless)│  (Horizontal scaling supported)
    └────┬────┘
         │
    ┌────┴──────────────────────┐
    │                           │
┌───┴────┐  ┌────────┐  ┌──────┴──┐
│Postgres│  │ Neo4j  │  │  Redis  │
│  (RDS) │  │ (Aura) │  │(ElastiC)│
└────────┘  └────────┘  └─────────┘
```

**Deployment Options:**

| Environment | Recommended Setup | Cost Estimate |
|-------------|------------------|---------------|
| **Development** | Docker Compose on local machine | $0 |
| **Staging** | Docker Compose on single VM (4 CPU, 16GB RAM) | $100/month |
| **Production (Small)** | Managed services (AWS RDS, Neo4j Aura, ElastiCache) | $500/month |
| **Production (Large)** | Kubernetes cluster with auto-scaling | $2,000+/month |

---

## 2. System Requirements

### 2.1 Minimum Requirements (Development)

| Component | Requirement |
|-----------|-------------|
| **CPU** | 2 cores |
| **RAM** | 8 GB |
| **Disk** | 20 GB SSD |
| **OS** | Ubuntu 22.04+, macOS 12+, Windows 10+ (WSL2) |
| **Docker** | 24.0+ |
| **Docker Compose** | 2.0+ |

---

### 2.2 Recommended Requirements (Production)

#### Backend API Server

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| **CPU** | 2 cores | 2 cores | 4 cores (auto-scale to 8) |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Disk** | 10 GB | 20 GB | 50 GB SSD |
| **Instances** | 1 | 1 | 3+ (behind load balancer) |

#### PostgreSQL

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| **CPU** | Shared | 2 cores | 4 cores |
| **RAM** | 2 GB | 8 GB | 32 GB |
| **Disk** | 10 GB | 50 GB | 500 GB SSD (IOPS: 3,000+) |
| **Connections** | 100 | 200 | 500 |

**AWS RDS Recommendation:** `db.r6g.xlarge` (4 vCPU, 32 GB RAM)

#### Neo4j

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| **CPU** | Shared | 2 cores | 4 cores |
| **RAM** | 2 GB | 8 GB | 16 GB |
| **Disk** | 5 GB | 20 GB | 200 GB SSD |
| **Heap Size** | 1 GB | 4 GB | 8 GB |

**Neo4j Aura Recommendation:** Professional tier (4 CPU, 16 GB RAM)

#### Redis

| Resource | Development | Staging | Production |
|----------|-------------|---------|------------|
| **RAM** | 512 MB | 2 GB | 8 GB |
| **Persistence** | None | RDB snapshots | AOF + RDB |
| **Replication** | None | None | Primary + 2 replicas |

**AWS ElastiCache Recommendation:** `cache.r6g.large` (2 vCPU, 13 GB RAM)

---

## 3. Environment Variables

### 3.1 Complete Environment Variable Reference

Create a `.env` file in the project root:

```bash
# ============================================
# APPLICATION
# ============================================
APP_ENV=production                           # development | staging | production
APP_NAME=Arc Zero
APP_VERSION=1.0.0
LOG_LEVEL=info                              # trace | debug | info | warn | error
RUST_LOG=archzero=info,axum=warn           # Rust-specific logging

# ============================================
# API SERVER
# ============================================
API_HOST=0.0.0.0                            # Bind to all interfaces
API_PORT=8080                               # Internal port (behind load balancer)
API_BASE_URL=https://api.archzero.com      # External URL (for CORS, webhooks)
API_WORKERS=4                               # Number of worker threads (CPU cores)
API_REQUEST_TIMEOUT=30                      # Seconds
API_MAX_BODY_SIZE=10485760                  # 10 MB in bytes

# ============================================
# DATABASE - POSTGRESQL
# ============================================
DATABASE_URL=postgresql://archzero:CHANGE_ME@postgres:5432/archzero
# Format: postgresql://user:password@host:port/database

# Connection Pool
DATABASE_MAX_CONNECTIONS=50
DATABASE_MIN_CONNECTIONS=10
DATABASE_CONNECT_TIMEOUT=10                 # Seconds
DATABASE_IDLE_TIMEOUT=600                   # 10 minutes

# SSL (Production)
DATABASE_SSL_MODE=require                   # disable | allow | prefer | require | verify-ca | verify-full
DATABASE_SSL_CERT=/etc/ssl/certs/postgres-ca.pem  # Optional: CA certificate path

# ============================================
# DATABASE - NEO4J
# ============================================
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=CHANGE_ME
NEO4J_DATABASE=neo4j                        # Default database name

# Connection Pool
NEO4J_MAX_CONNECTIONS=50
NEO4J_CONNECT_TIMEOUT=10                    # Seconds
NEO4J_MAX_TRANSACTION_RETRY=3

# SSL (Production)
NEO4J_ENCRYPTED=true                        # Enable TLS
NEO4J_TRUST_STRATEGY=TRUST_SYSTEM_CA_SIGNED_CERTIFICATES

# ============================================
# CACHE - REDIS
# ============================================
REDIS_URL=redis://redis:6379/0
# Format: redis://[user:password@]host:port/database

# Connection Pool
REDIS_MAX_CONNECTIONS=20
REDIS_CONNECT_TIMEOUT=5                     # Seconds

# Cache TTL (Time To Live)
REDIS_TTL_DEFAULT=900                       # 15 minutes
REDIS_TTL_LANDSCAPE=1800                    # 30 minutes (expensive query)
REDIS_TTL_FAN_IN=900                        # 15 minutes

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
JWT_SECRET=CHANGE_ME_TO_RANDOM_64_CHAR_STRING
# Generate with: openssl rand -base64 64

JWT_ACCESS_TOKEN_EXPIRY=3600                # 1 hour (seconds)
JWT_REFRESH_TOKEN_EXPIRY=604800             # 7 days (seconds)
JWT_ISSUER=archzero-auth-service
JWT_AUDIENCE=archzero-api

# Password Hashing
PASSWORD_HASH_COST=12                       # Bcrypt cost (10-14 recommended)

# CORS
CORS_ALLOWED_ORIGINS=https://app.archzero.com,https://archzero.com
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization
CORS_MAX_AGE=3600                           # 1 hour

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STANDARD=1000                    # Requests per hour (CRUD operations)
RATE_LIMIT_EXPENSIVE=100                    # Requests per hour (graph queries)
RATE_LIMIT_AUTH=10                          # Requests per 15 minutes (login)

# ============================================
# INTEGRATIONS
# ============================================

# Pustaka ITAM Integration
PUSTAKA_API_URL=https://pustaka.example.com/api/v1
PUSTAKA_API_KEY=CHANGE_ME
PUSTAKA_SYNC_ENABLED=true
PUSTAKA_SYNC_SCHEDULE=0 2 * * *             # Cron: Daily at 2 AM UTC

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@archzero.com
SMTP_PASSWORD=CHANGE_ME
SMTP_FROM=Arc Zero <notifications@archzero.com>
SMTP_TLS=true

# Webhook Configuration
WEBHOOK_TIMEOUT=10                          # Seconds
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=5                       # Seconds

# ============================================
# FILE STORAGE
# ============================================
STORAGE_TYPE=s3                             # local | s3 | azure

# S3 Configuration (if STORAGE_TYPE=s3)
S3_BUCKET=archzero-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY=CHANGE_ME
S3_SECRET_KEY=CHANGE_ME
S3_ENDPOINT=https://s3.amazonaws.com        # Custom endpoint for S3-compatible services

# Local Storage (if STORAGE_TYPE=local)
STORAGE_LOCAL_PATH=/var/archzero/uploads

# ============================================
# MONITORING & OBSERVABILITY
# ============================================

# Metrics (Prometheus)
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics

# Tracing (OpenTelemetry)
TRACING_ENABLED=true
TRACING_ENDPOINT=http://jaeger:4317
TRACING_SERVICE_NAME=archzero-api

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health

# Sentry (Error Tracking)
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=0.1                      # 10% of errors

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_EXCEL_IMPORT=true
FEATURE_6R_ENGINE=true
FEATURE_BIA_ENGINE=true
FEATURE_TCO_CALCULATOR=true
FEATURE_WEBHOOKS=true

# ============================================
# FRONTEND (Build-time variables)
# ============================================
VITE_API_BASE_URL=https://api.archzero.com
VITE_APP_NAME=Arc Zero
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://xyz789@o123456.ingest.sentry.io/7654322
```

---

### 3.2 Environment-Specific Overrides

#### Development (`.env.development`)
```bash
APP_ENV=development
LOG_LEVEL=debug
API_BASE_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_ENABLED=false
SENTRY_ENABLED=false
```

#### Staging (`.env.staging`)
```bash
APP_ENV=staging
LOG_LEVEL=info
API_BASE_URL=https://staging-api.archzero.com
SENTRY_ENVIRONMENT=staging
```

#### Production (`.env.production`)
```bash
APP_ENV=production
LOG_LEVEL=warn
DATABASE_SSL_MODE=require
NEO4J_ENCRYPTED=true
RATE_LIMIT_ENABLED=true
```

---

### 3.3 Secret Management

**⚠️ NEVER commit `.env` files to Git!**

**Recommended Secrets Management:**

| Environment | Solution |
|-------------|----------|
| **Development** | `.env` file (local only) |
| **Staging/Production** | AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets |

**AWS Secrets Manager Example:**
```bash
# Store secrets
aws secretsmanager create-secret \
  --name archzero/production/database \
  --secret-string '{"username":"archzero","password":"..."}'

# Retrieve in app
DATABASE_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id archzero/production/database \
  --query SecretString --output text | jq -r .password)
```

**Kubernetes Secrets Example:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: archzero-secrets
type: Opaque
stringData:
  jwt-secret: "your-secret-here"
  database-password: "your-db-password"
```

---

## 4. Production Deployment

### 4.1 Docker Compose (Staging/Small Production)

**File: `docker-compose.prod.yml`**

```yaml
version: '3.9'

services:
  # ============================================
  # BACKEND API
  # ============================================
  api:
    image: archzero/backend:1.0.0
    container_name: archzero-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - APP_ENV=production
      - DATABASE_URL=postgresql://archzero:${DB_PASSWORD}@postgres:5432/archzero
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - neo4j
      - redis
    networks:
      - archzero-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================
  # FRONTEND (Nginx serving static files)
  # ============================================
  frontend:
    image: archzero/frontend:1.0.0
    container_name: archzero-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - archzero-network

  # ============================================
  # POSTGRESQL
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: archzero-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=archzero
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=archzero
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups/postgres:/backups
    ports:
      - "5432:5432"
    networks:
      - archzero-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U archzero"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: >
      postgres
      -c max_connections=200
      -c shared_buffers=2GB
      -c effective_cache_size=6GB
      -c maintenance_work_mem=512MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1

  # ============================================
  # NEO4J
  # ============================================
  neo4j:
    image: neo4j:5-enterprise
    container_name: archzero-neo4j
    restart: unless-stopped
    environment:
      - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
      - NEO4J_server_memory_heap_initial__size=2G
      - NEO4J_server_memory_heap_max__size=4G
      - NEO4J_server_memory_pagecache_size=4G
      - NEO4J_dbms_security_procedures_unrestricted=apoc.*
      - NEO4JLABS_PLUGINS=["apoc"]
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
      - ./backups/neo4j:/backups
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    networks:
      - archzero-network
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "${NEO4J_PASSWORD}", "RETURN 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================
  # REDIS
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: archzero-redis
    restart: unless-stopped
    command: >
      redis-server
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --save 900 1
      --save 300 10
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - archzero-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # ============================================
  # PROMETHEUS (Monitoring)
  # ============================================
  prometheus:
    image: prom/prometheus:latest
    container_name: archzero-prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - archzero-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  # ============================================
  # GRAFANA (Dashboards)
  # ============================================
  grafana:
    image: grafana/grafana:latest
    container_name: archzero-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    networks:
      - archzero-network
    depends_on:
      - prometheus

networks:
  archzero-network:
    driver: bridge

volumes:
  postgres-data:
  neo4j-data:
  neo4j-logs:
  redis-data:
  prometheus-data:
  grafana-data:
```

---

**Deploy:**
```bash
# 1. Set environment variables
export DB_PASSWORD="$(openssl rand -base64 32)"
export NEO4J_PASSWORD="$(openssl rand -base64 32)"
export JWT_SECRET="$(openssl rand -base64 64)"
export GRAFANA_PASSWORD="$(openssl rand -base64 16)"

# 2. Save to .env.production
cat > .env.production <<EOF
DB_PASSWORD=${DB_PASSWORD}
NEO4J_PASSWORD=${NEO4J_PASSWORD}
JWT_SECRET=${JWT_SECRET}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
EOF

# 3. Start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 4. Check status
docker-compose -f docker-compose.prod.yml ps

# 5. View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

---

### 4.2 Kubernetes (Large Production)

**File: `k8s/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: archzero-api
  namespace: archzero
spec:
  replicas: 3
  selector:
    matchLabels:
      app: archzero-api
  template:
    metadata:
      labels:
        app: archzero-api
    spec:
      containers:
      - name: api
        image: archzero/backend:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: archzero-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: archzero-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: archzero-api-service
  namespace: archzero
spec:
  selector:
    app: archzero-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: archzero-api-hpa
  namespace: archzero
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: archzero-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Deploy:**
```bash
# 1. Create namespace
kubectl create namespace archzero

# 2. Create secrets
kubectl create secret generic archzero-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  --namespace=archzero

# 3. Apply manifests
kubectl apply -f k8s/deployment.yaml

# 4. Check status
kubectl get pods -n archzero
kubectl get svc -n archzero

# 5. View logs
kubectl logs -f deployment/archzero-api -n archzero
```

---

## 5. Database Setup

### 5.1 PostgreSQL Initialization

**Step 1: Create Database**
```bash
# Using Docker Compose
docker-compose exec postgres psql -U archzero

# Or using psql directly
psql -h localhost -U archzero -d postgres
```

```sql
-- Create database
CREATE DATABASE archzero;

-- Create extensions
\c archzero
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
```

---

**Step 2: Run Migrations**
```bash
# Using diesel-cli (Rust migrations)
cargo install diesel_cli --no-default-features --features postgres

# Run migrations
diesel migration run --database-url="postgresql://archzero:password@localhost:5432/archzero"

# OR using custom migration tool
cargo run --bin migrate
```

---

**Step 3: Seed Initial Data (Optional)**
```bash
# Seed reference data (metamodel rules, default scoring profiles)
cargo run --bin seed

# Import sample data (for demo)
cargo run --bin seed --sample enterprise-demo
```

---

### 5.2 Neo4j Initialization

**Step 1: Access Neo4j Browser**
```
Open browser: http://localhost:7474
Login: neo4j / <NEO4J_PASSWORD>
```

**Step 2: Create Constraints**
```cypher
// Unique constraint on Card ID
CREATE CONSTRAINT card_id_unique IF NOT EXISTS
FOR (n:Card) REQUIRE n.id IS UNIQUE;

// Performance indexes
CREATE INDEX card_id_index IF NOT EXISTS
FOR (n:Card) ON (n.id);

CREATE INDEX rel_valid_from_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_from);

CREATE INDEX rel_valid_to_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_to);
```

**Step 3: Install APOC (Advanced Procedures)**
```cypher
// Verify APOC is installed
CALL apoc.help("apoc");

// If not installed, add to docker-compose.yml:
// NEO4JLABS_PLUGINS: '["apoc"]'
```

---

### 5.3 Database Backup

#### PostgreSQL Backup

**Manual Backup:**
```bash
# Backup to file
docker-compose exec postgres pg_dump -U archzero archzero > backup_$(date +%Y%m%d).sql

# Backup with compression
docker-compose exec postgres pg_dump -U archzero archzero | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Automated Backup (Cron):**
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /usr/bin/docker-compose -f /opt/archzero/docker-compose.prod.yml exec -T postgres pg_dump -U archzero archzero | gzip > /backup/archzero_$(date +\%Y\%m\%d).sql.gz
```

**Restore:**
```bash
# Restore from backup
gunzip -c backup_20260112.sql.gz | docker-compose exec -T postgres psql -U archzero archzero
```

---

#### Neo4j Backup

**Manual Backup:**
```bash
# Stop Neo4j first (to ensure consistency)
docker-compose stop neo4j

# Backup data directory
tar -czf neo4j_backup_$(date +%Y%m%d).tar.gz ./neo4j-data/

# Restart Neo4j
docker-compose start neo4j
```

**Online Backup (Enterprise Edition):**
```bash
docker-compose exec neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j-$(date +%Y%m%d).dump
```

**Restore:**
```bash
docker-compose stop neo4j
docker-compose exec neo4j neo4j-admin load --from=/backups/neo4j-20260112.dump --database=neo4j --force
docker-compose start neo4j
```

---

## 6. Monitoring & Logging

### 6.1 Health Check Endpoints

**API Health Check:**
```bash
curl http://localhost:8080/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-12T10:00:00Z",
  "checks": {
    "database": {
      "status": "up",
      "response_time_ms": 5
    },
    "neo4j": {
      "status": "up",
      "response_time_ms": 8
    },
    "redis": {
      "status": "up",
      "response_time_ms": 1
    }
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "down",
      "error": "connection timeout"
    }
  }
}
```

---

### 6.2 Prometheus Metrics

**Configuration: `prometheus.yml`**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'archzero-api'
    static_configs:
      - targets: ['api:9090']
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'neo4j'
    static_configs:
      - targets: ['neo4j:2004']
    
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**Key Metrics:**

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `http_request_duration_seconds` | API response time | p95 > 500ms |
| `http_requests_total` | Request count | - |
| `database_connections_active` | Postgres connections | > 80% of max |
| `neo4j_query_duration_seconds` | Graph query time | p95 > 1s |
| `redis_memory_used_bytes` | Redis memory usage | > 90% of max |

---

### 6.3 Logging

**Log Format (JSON):**
```json
{
  "timestamp": "2026-01-12T10:00:00Z",
  "level": "INFO",
  "target": "archzero::api::cards",
  "message": "Card created",
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user-123",
  "request_id": "req-abc-123"
}
```

**Log Aggregation (ELK Stack or Loki):**
```yaml
# docker-compose.yml addition
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
    
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yml
```

---

## 7. Backup & Recovery

### 7.1 Backup Schedule

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| **PostgreSQL** | Daily (2 AM UTC) | 30 days | S3 bucket (encrypted) |
| **Neo4j** | Daily (3 AM UTC) | 30 days | S3 bucket (encrypted) |
| **Redis** | Hourly (RDB snapshot) | 7 days | Local volume |
| **Uploaded Files** | Continuous (if S3) | Indefinite | S3 versioning |

---

### 7.2 Disaster Recovery Plan

**RTO (Recovery Time Objective):** < 4 hours  
**RPO (Recovery Point Objective):** < 1 hour

**Recovery Steps:**

1. **Provision New Infrastructure** (30 minutes)
   ```bash
   # Deploy fresh environment
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Restore PostgreSQL** (1 hour)
   ```bash
   # Download backup from S3
   aws s3 cp s3://archzero-backups/postgres/latest.sql.gz .
   
   # Restore
   gunzip -c latest.sql.gz | docker-compose exec -T postgres psql -U archzero archzero
   ```

3. **Restore Neo4j** (1 hour)
   ```bash
   # Download backup
   aws s3 cp s3://archzero-backups/neo4j/latest.dump .
   
   # Restore
   docker-compose exec neo4j neo4j-admin load --from=/backups/latest.dump --database=neo4j --force
   ```

4. **Verify Data Integrity** (30 minutes)
   ```bash
   # Check record counts
   docker-compose exec postgres psql -U archzero -c "SELECT COUNT(*) FROM cards;"
   docker-compose exec neo4j cypher-shell -u neo4j -p password "MATCH (n:Card) RETURN count(n)"
   
   # Run smoke tests
   curl http://localhost:8080/health
   ```

5. **Update DNS** (30 minutes)
   - Point domain to new load balancer IP
   - Wait for DNS propagation

---

## 8. Security Hardening

### 8.1 SSL/TLS Configuration

**Nginx SSL Config:**
```nginx
server {
    listen 443 ssl http2;
    server_name app.archzero.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'" always;
}
```

---

### 8.2 Firewall Rules

**iptables Configuration:**
```bash
# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Block database ports from external access
iptables -A INPUT -p tcp --dport 5432 -s 10.0.0.0/8 -j ACCEPT  # Allow from private network
iptables -A INPUT -p tcp --dport 5432 -j DROP  # Block from internet

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

---

### 8.3 Database Security

**PostgreSQL:**
```sql
-- Revoke public access
REVOKE ALL ON DATABASE archzero FROM PUBLIC;

-- Create read-only user for reporting
CREATE USER archzero_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE archzero TO archzero_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO archzero_readonly;
```

**Neo4j:**
```cypher
// Create read-only role
CREATE ROLE reader;
GRANT TRAVERSE ON GRAPH * TO reader;
GRANT READ {*} ON GRAPH * TO reader;
DENY WRITE ON GRAPH * TO reader;
```

---

## 9. Troubleshooting

### 9.1 Common Issues

#### Issue 1: Neo4j Connection Timeout

**Symptoms:**
```
Error: Neo4j connection timeout after 10 seconds
```

**Diagnosis:**
```bash
# Check Neo4j is running
docker-compose ps neo4j

# Check Neo4j logs
docker-compose logs neo4j

# Test connection
docker-compose exec neo4j cypher-shell -u neo4j -p password "RETURN 1"
```

**Solutions:**
1. Verify `NEO4J_PASSWORD` is correct
2. Check firewall rules (port 7687)
3. Increase `NEO4J_CONNECT_TIMEOUT` in `.env`
4. Check Neo4j heap size (may be OOM)

---

#### Issue 2: Postgres High Connection Count

**Symptoms:**
```
FATAL: remaining connection slots are reserved
```

**Diagnosis:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- See connections by state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

**Solutions:**
1. Increase `max_connections` in postgres.conf
2. Reduce `DATABASE_MAX_CONNECTIONS` in app
3. Check for connection leaks (connections not closed)
4. Implement connection pooling (PgBouncer)

---

#### Issue 3: Redis Memory Full

**Symptoms:**
```
OOM command not allowed when used memory > 'maxmemory'
```

**Diagnosis:**
```bash
# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Check key count
docker-compose exec redis redis-cli DBSIZE
```

**Solutions:**
1. Increase Redis memory limit (`maxmemory 4gb`)
2. Set eviction policy: `maxmemory-policy allkeys-lru`
3. Clear cache: `docker-compose exec redis redis-cli FLUSHDB`
4. Reduce TTL values in `.env`

---

### 9.2 Performance Debugging

**Slow API Response:**

```bash
# Enable query logging
RUST_LOG=debug cargo run --bin server

# Profile specific endpoint
curl -w "@curl-format.txt" http://localhost:8080/api/v1/cards
```

**Slow Database Queries:**

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Slow Neo4j Queries:**

```cypher
// Profile query
PROFILE MATCH (app:Application)-[:RELIES_ON]->(comp:ITComponent)
RETURN app, comp;

// Check query plan
EXPLAIN MATCH ...
```

---

### 9.3 Emergency Procedures

**Database Rollback:**
```bash
# Stop API (prevent new writes)
docker-compose stop api

# Restore from last known good backup
gunzip -c /backups/postgres_20260111.sql.gz | \
  docker-compose exec -T postgres psql -U archzero archzero

# Restart API
docker-compose start api
```

**Clear All Caches:**
```bash
# Redis
docker-compose exec redis redis-cli FLUSHALL

# Restart API (clear in-memory caches)
docker-compose restart api
```

---

## Appendix: Useful Commands

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View logs (all services)
docker-compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker-compose -f docker-compose.prod.yml logs -f api

# Restart single service
docker-compose -f docker-compose.prod.yml restart api

# Execute command in container
docker-compose exec postgres psql -U archzero

# Remove all volumes (DATA LOSS!)
docker-compose down -v
```

### Database

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U archzero

# Neo4j shell
docker-compose exec neo4j cypher-shell -u neo4j -p password

# Redis shell
docker-compose exec redis redis-cli
```

### Maintenance

```bash
# Vacuum PostgreSQL (reclaim space)
docker-compose exec postgres vacuumdb -U archzero --all --analyze

# Check disk usage
docker system df

# Prune unused images/containers
docker system prune -a
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-12 | Initial deployment guide | DevOps Team |

---

**Support:**
- Documentation: https://docs.archzero.com
- Issues: https://github.com/tahopetis/archzero/issues
- Email: devops@archzero.com
