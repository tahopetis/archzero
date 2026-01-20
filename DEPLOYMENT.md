# Arc Zero Docker Deployment Guide

This guide covers building and deploying Arc Zero using Docker containers.

## Prerequisites

- Docker 20.10+ installed
- Docker Compose v2.0+ installed
- At least 4GB RAM available for Docker
- Ports 80, 8080, 5432, 7474, 7687, 6379 available

## Quick Start

### 1. Setup Environment

```bash
# Copy production environment template
cp .env.production.example .env

# Edit .env with your production values
nano .env
```

**IMPORTANT Security Settings:**
- Generate strong passwords for each service
- Set a secure JWT_SECRET: `openssl rand -base64 32`
- Update CORS_ALLOWED_ORIGINS with your actual domain

### 2. Build Images

**Option A: Using Makefile (Recommended)**
```bash
make build
```

**Option B: Using Docker directly**
```bash
# Build backend
docker build -t archzero-api:latest -f archzero-api/Dockerfile archzero-api/

# Build frontend
docker build -t archzero-ui:latest -f archzero-ui/Dockerfile archzero-ui/
```

**Option C: Using deployment script**
```bash
./scripts/deploy.sh build
```

### 3. Deploy

**Option A: Using Makefile (Recommended)**
```bash
make prod-up
```

**Option B: Using Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Option C: Using deployment script**
```bash
./scripts/deploy.sh deploy
```

## Services

The production deployment includes the following services:

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| Frontend UI | archzero-ui | 80 | React application (nginx) |
| Backend API | archzero-api | 8080 | Rust/Axum API |
| PostgreSQL | archzero-postgres | 5432 | Primary database |
| Neo4j | archzero-neo4j | 7474, 7687 | Graph database |
| Redis | archzero-redis | 6379 | Cache layer |

## Database Migrations

Database migrations are stored in `archzero-api/migrations/` and are automatically applied by the application on startup.

### Available Migrations

- `001_add_performance_indexes.sql` - Performance optimization indexes
- `002_query_analysis.sql` - Query analysis utilities
- `004_create_users_table.sql` - User authentication tables
- `005_add_auth_columns.sql` - Additional authentication columns
- `006_seed_arb_users.sql` - Seed ARB users
- `007_update_user_roles.sql` - User role updates
- `008_create_arb_templates.sql` - ARB templates
- `009_create_arb_audit_logs.sql` - ARB audit logging
- `010_create_arb_notifications.sql` - ARB notifications

### Manual Migration

If you need to run migrations manually:

```bash
# Using Makefile
make db-migrate

# Or directly
docker-compose -f docker-compose.prod.yml exec api ./archzero-api --migrate
```

## Common Commands

### Using Makefile (Recommended)

```bash
# Show all available commands
make help

# Development
make dev-up          # Start development environment
make dev-down        # Stop development environment
make dev-logs        # Show development logs

# Production
make prod-up         # Start production
make prod-down       # Stop production
make prod-restart    # Restart production
make prod-logs       # Show all logs
make prod-logs-api   # Show API logs
make prod-logs-ui    # Show UI logs

# Database
make db-migrate      # Run migrations
make db-reset        # Reset database (WARNING: deletes data)
make db-seed         # Seed sample data

# Utilities
make ps              # Show running containers
make stats           # Show resource usage
make health          # Check service health
make clean           # Remove everything (WARNING: destructive)
```

### Using Deployment Script

```bash
# Setup environment
./scripts/deploy.sh setup

# Build and deploy
./scripts/deploy.sh build
./scripts/deploy.sh deploy

# View logs
./scripts/deploy.sh logs          # All services
./scripts/deploy.sh logs api      # API only
./scripts/deploy.sh logs ui       # UI only

# Management
./scripts/deploy.sh stop
./scripts/deploy.sh restart
./scripts/deploy.sh health
./scripts/deploy.sh cleanup
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api

# Show running containers
docker-compose -f docker-compose.prod.yml ps
```

## Health Checks

### Automated Health Checks

All services include health checks that run every 30 seconds:

```bash
# Check health status
make health

# Or manually
curl http://localhost:8080/api/v1/health
```

### Service Health Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 api
```

### Resource Usage

```bash
# Live stats
make stats

# Or
docker stats $(docker-compose -f docker-compose.prod.yml ps -q)
```

## Troubleshooting

### Services Won't Start

1. **Check port conflicts:**
   ```bash
   netstat -tulpn | grep -E ':(80|8080|5432|7474|7687|6379)'
   ```

2. **Check Docker logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose -f docker-compose.prod.yml config
   ```

### Database Connection Issues

1. **Verify PostgreSQL is ready:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U archzero
   ```

2. **Check database logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

3. **Test connection from API container:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec api sh -c 'ping -c 2 postgres'
   ```

### API Errors

1. **Check API is healthy:**
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

2. **View API logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs api
   ```

3. **Restart API:**
   ```bash
   docker-compose -f docker-compose.prod.yml restart api
   ```

### Build Failures

1. **Clean build without cache:**
   ```bash
   make build-no-cache
   ```

2. **Remove old images:**
   ```bash
   docker rmi archzero-api archzero-ui
   make build
   ```

## Backup and Restore

### Backup Volumes

```bash
# Backup PostgreSQL
docker exec archzero-postgres pg_dump -U archzero archzero > backup.sql

# Backup Neo4j
docker exec archzero-neo4j neo4j-admin dump --database=neo4j --to=/backup/neo4j-backup

# Backup all volumes
docker run --rm -v archzero_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
docker run --rm -v archzero_neo4j_data:/data -v $(pwd):/backup alpine tar czf /backup/neo4j-backup.tar.gz -C /data .
```

### Restore Volumes

```bash
# Restore PostgreSQL
docker exec -i archzero-postgres psql -U archzero archzero < backup.sql

# Restore Neo4j
docker exec archzero-neo4j neo4j-admin load --from=/backup/neo4j-backup --database=neo4j --force
```

## Security Considerations

1. **Change all default passwords** in `.env`
2. **Use strong JWT secret**: Generate with `openssl rand -base64 32`
3. **Update CORS_ALLOWED_ORIGINS** with your actual domain
4. **Use HTTPS in production** with a reverse proxy (nginx, Traefik)
5. **Don't commit .env** to version control
6. **Use secrets management** in production (HashiCorp Vault, AWS Secrets Manager, etc.)
7. **Regular security updates**: Keep Docker images updated
8. **Network isolation**: Services are on internal Docker network
9. **Resource limits**: Consider adding memory/CPU limits in docker-compose

## Production Deployment

For production deployment:

1. **Use a reverse proxy** (nginx, Traefik) for SSL/TLS termination
2. **Set up monitoring** (Prometheus, Grafana)
3. **Configure log aggregation** (ELK, Loki)
4. **Enable backups** (automated database dumps)
5. **Use orchestration** (Kubernetes, Docker Swarm) for high availability
6. **Load balancing** for multiple API/UI instances
7. **CDN** for static assets
8. **Rate limiting** (already configured in the application)
9. **Security scanning** (Trivy, Snyk)
10. **Disaster recovery plan**

## Updating

To update to a new version:

```bash
# Pull latest code
git pull

# Rebuild images
make build

# Restart services
make prod-restart
```

## Additional Resources

- **Main README**: `README.md`
- **Developer Guide**: `CLAUDE.md`
- **Codebase Map**: `docs/CODEBASE_MAP.md`
- **API Documentation**: `docs/05-api-spec.md`
