#!/bin/bash
# Migration Runner for Arc Zero
# This script runs SQL migrations from the migrations/ directory

set -e

# Default values
MIGRATIONS_DIR="/app/migrations"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-archzero}"
DB_USER="${DB_USER:-archzero}"
DB_PASSWORD="${POSTGRES_PASSWORD:-}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[INFO]${NC} Migration Runner for Arc Zero"
echo ""

# Wait for database to be ready
echo -e "${BLUE}[INFO]${NC} Waiting for database to be ready..."
until PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo -e "${GREEN}[SUCCESS]${NC} Database is ready"
echo ""

# Get list of migration files (sorted by filename)
MIGRATION_FILES=$(ls -v "$MIGRATIONS_DIR"/*.sql 2>/dev/null || true)

if [ -z "$MIGRATION_FILES" ]; then
    echo -e "${BLUE}[INFO]${NC} No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

# Create migrations tracking table if it doesn't exist
echo -e "${BLUE}[INFO]${NC} Creating migrations tracking table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1 << 'EOF'
CREATE TABLE IF NOT EXISTS _schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# Run each migration that hasn't been applied yet
for migration_file in $MIGRATION_FILES; do
    filename=$(basename "$migration_file")

    # Check if migration has already been applied
    applied=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _schema_migrations WHERE filename = '$filename'" 2>/dev/null || echo "0")

    if [ "$applied" -gt 0 ]; then
        echo -e "${BLUE}[INFO]${NC} Skipping already applied migration: $filename"
        continue
    fi

    echo -e "${BLUE}[INFO]${NC} Applying migration: $filename"

    # Run the migration
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        # Record the migration
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1 << EOF
INSERT INTO _schema_migrations (filename) VALUES ('$filename');
EOF
        echo -e "${GREEN}[SUCCESS]${NC} Applied migration: $filename"
    else
        echo -e "\033[0;31m[ERROR]\033[0m Failed to apply migration: $filename"
        exit 1
    fi

    echo ""
done

echo -e "${GREEN}[SUCCESS]${NC} All migrations applied successfully"
