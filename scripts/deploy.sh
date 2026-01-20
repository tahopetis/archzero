#!/bin/bash
# Arc Zero Deployment Script
# This script helps with building and deploying Arc Zero in production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
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

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        echo ""
        log_info "Please create .env file from the example:"
        echo "  cp .env.production.example .env"
        echo "  # Then edit .env with your production values"
        exit 1
    fi
    log_success ".env file found"
}

# Generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Setup production environment
setup() {
    log_info "Setting up production environment..."

    if [ -f .env ]; then
        log_warning ".env file already exists"
        read -p "Overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping setup"
            return
        fi
    fi

    log_info "Creating .env file with secure passwords..."

    # Generate secure passwords
    POSTGRES_PASSWORD=$(generate_password)
    NEO4J_PASSWORD=$(generate_password)
    REDIS_PASSWORD=$(generate_password)
    JWT_SECRET=$(openssl rand -base64 32)

    # Create .env file
    cat > .env << EOF
# Arc Zero Production Environment
# Generated on $(date)

# Database Configuration
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_PORT=5432

NEO4J_PASSWORD=${NEO4J_PASSWORD}
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687

REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=6379

# Application Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION_HOURS=24

# Server Ports
API_PORT=8080
UI_PORT=80

# CORS - Update with your domain
CORS_ALLOWED_ORIGINS=http://localhost,https://your-domain.com

# Logging
RUST_LOG=info
EOF

    log_success ".env file created"
    log_warning "Please update CORS_ALLOWED_ORIGINS with your actual domain"
    log_warning "Keep these passwords secure!"
}

# Build all images
build() {
    log_info "Building Docker images..."

    log_info "Building backend API..."
    docker build -t archzero-api:latest -f archzero-api/Dockerfile archzero-api/

    log_info "Building frontend UI..."
    docker build -t archzero-ui:latest -f archzero-ui/Dockerfile archzero-ui/

    log_success "All images built successfully"
}

# Deploy to production
deploy() {
    check_env

    log_info "Deploying Arc Zero to production..."

    # Load environment variables
    source .env

    # Start services
    docker-compose -f docker-compose.prod.yml up -d

    log_success "Deployment started"
    log_info "Waiting for services to be healthy..."
    sleep 15

    # Check service status
    docker-compose -f docker-compose.prod.yml ps

    log_success "Deployment complete!"
    echo ""
    log_info "Access the application at:"
    echo "  Frontend: http://localhost:${UI_PORT:-80}"
    echo "  Backend:  http://localhost:${API_PORT:-8080}"
    echo "  Neo4j:   http://localhost:${NEO4J_HTTP_PORT:-7474}"
}

# Stop services
stop() {
    log_info "Stopping Arc Zero..."
    docker-compose -f docker-compose.prod.yml down
    log_success "Services stopped"
}

# Restart services
restart() {
    log_info "Restarting Arc Zero..."
    docker-compose -f docker-compose.prod.yml restart
    log_success "Services restarted"
}

# Show logs
logs() {
    if [ -z "$1" ]; then
        log_info "Showing all logs (Ctrl+C to exit)..."
        docker-compose -f docker-compose.prod.yml logs -f
    else
        log_info "Showing logs for $1 (Ctrl+C to exit)..."
        docker-compose -f docker-compose.prod.yml logs -f "$1"
    fi
}

# Check health
health() {
    log_info "Checking service health..."
    echo ""

    docker-compose -f docker-compose.prod.yml ps

    echo ""
    log_info "API Health Check:"
    if curl -s http://localhost:8080/api/v1/health > /dev/null; then
        log_success "API is responding"
    else
        log_error "API is not responding"
    fi

    echo ""
    log_info "UI Health Check:"
    if curl -s http://localhost/ > /dev/null; then
        log_success "UI is responding"
    else
        log_error "UI is not responding"
    fi
}

# Cleanup everything
cleanup() {
    log_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        docker-compose -f docker-compose.prod.yml down -v --rmi all
        docker system prune -f
        log_success "Cleanup complete"
    else
        log_info "Cleanup aborted"
    fi
}

# Show usage
usage() {
    echo "Arc Zero Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup      - Setup production environment (.env file)"
    echo "  build      - Build Docker images"
    echo "  deploy     - Deploy to production"
    echo "  stop       - Stop services"
    echo "  restart    - Restart services"
    echo "  logs       - Show logs (all services)"
    echo "  logs [service] - Show logs for specific service"
    echo "  health     - Check service health"
    echo "  cleanup    - Remove all containers, volumes, and images"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 build"
    echo "  $0 deploy"
    echo "  $0 logs api"
}

# Main
case "$1" in
    setup)
        setup
        ;;
    build)
        build
        ;;
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    health)
        health
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        usage
        exit 1
        ;;
esac
