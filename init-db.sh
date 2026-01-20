#!/bin/bash
# Database initialization script for Arc Zero
# This script runs automatically when PostgreSQL container starts

set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -U archzero; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - executing initialization"

# Apply migrations from the archzero-api container
# The migrations will be run by the Rust application using SQLx
echo "Migrations will be applied by the application on startup"
