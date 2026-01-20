# Arc Zero Docker Quick Start

This guide will help you get Arc Zero running with Docker in minutes.

## Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- 4GB+ RAM available

## 30-Second Setup

```bash
# 1. Clone and navigate to project
git clone https://github.com/tahopetis/archzero.git
cd archzero

# 2. Setup environment (auto-generates secure passwords)
./scripts/deploy.sh setup

# 3. Update CORS domain
nano .env  # Change CORS_ALLOWED_ORIGINS to your domain

# 4. Build and deploy
make build
make prod-up

# 5. Check health
make health
```

**That's it!** Access the application at:
- Frontend: http://localhost:80
- Backend API: http://localhost:8080
- Neo4j Browser: http://localhost:7474 (neo4j/your-neo4j-password)

## What Happens During Startup?

1. **PostgreSQL** starts first
2. **Neo4j** initializes graph database
3. **Redis** starts caching service
4. **API** container:
   - Waits for database to be ready
   - Runs all SQL migrations automatically
   - Starts the Rust backend server
5. **UI** container starts serving the React frontend

## Database Migrations

Migrations run **automatically** on startup! They are:

- Located in: `archzero-api/migrations/`
- Tracked in: `_schema_migrations` table
- Run in order: `001_*.sql`, `002_*.sql`, etc.
- Only run once: Already-applied migrations are skipped

No manual intervention needed!

## Common Commands

```bash
# View all commands
make help

# Start/Stop
make prod-up      # Start production
make prod-down    # Stop production

# Logs
make prod-logs         # All services
make prod-logs-api     # API only
make prod-logs-ui      # UI only

# Health
make health        # Check all services
make ps            # Show containers

# Database
make db-migrate    # Run migrations manually
make db-reset      # Reset database (WARNING: deletes data)
make db-seed       # Add sample data

# Build
make build         # Build images
make build-no-cache  # Rebuild from scratch

# Cleanup
make clean         # Remove everything (WARNING: destructive)
```

## First Time Login

After deployment, login with the seeded admin account:

- **Email:** `admin@archzero.local`
- **Password:** `changeme123`

**IMPORTANT:** Change this password immediately after first login!

## Troubleshooting

### Services won't start?

```bash
# Check what's wrong
make prod-logs

# Restart everything
make prod-restart
```

### Port conflicts?

Edit `.env` to change ports:
```bash
API_PORT=8081     # Change API port
UI_PORT=8080      # Change UI port
POSTGRES_PORT=5433  # Change DB port
```

### Database issues?

```bash
# Reset and start fresh
make db-reset
make prod-restart
```

### Out of disk space?

```bash
# Clean Docker cache
docker system prune -a
```

## Next Steps

1. **Read the full guide:** `DEPLOYMENT.md`
2. **Check documentation:** `docs/`
3. **View API docs:** http://localhost:8080/api-docs (when running)
4. **Explore Neo4j:** http://localhost:7474

## Security Reminders

Before deploying to production:

✅ Change all default passwords in `.env`
✅ Generate a secure JWT_SECRET: `openssl rand -base64 32`
✅ Update CORS_ALLOWED_ORIGINS with your domain
✅ Enable HTTPS/TLS (use nginx/traefik reverse proxy)
✅ Set up regular backups
✅ Configure firewall rules
✅ Enable rate limiting
✅ Set up monitoring and logging

## Getting Help

- **Documentation:** See `docs/` directory
- **Issues:** https://github.com/tahopetis/archzero/issues
- **Deployment Guide:** `DEPLOYMENT.md`
- **Developer Guide:** `CLAUDE.md`

---

**Built with ❤️ for Enterprise Architects**
