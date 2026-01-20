# Arc Zero Docker Build and Deployment Makefile
# Usage: make [target]

.PHONY: help build build-api build-ui up down restart logs clean prod-build prod-up prod-down

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)Arc Zero Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

##@ Development

dev-up: ## Start development environment (docker-compose.dev.yml)
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✓ Development environment started$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Neo4j:   http://localhost:7474"

dev-down: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✓ Development environment stopped$(NC)"

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

##@ Production Build

build: build-api build-ui ## Build all Docker images

build-api: ## Build backend API image
	@echo "$(BLUE)Building backend API image...$(NC)"
	docker build -t archzero-api:latest -f archzero-api/Dockerfile archzero-api/
	@echo "$(GREEN)✓ Backend API image built$(NC)"

build-ui: ## Build frontend UI image
	@echo "$(BLUE)Building frontend UI image...$(NC)"
	docker build -t archzero-ui:latest -f archzero-ui/Dockerfile archzero-ui/
	@echo "$(GREEN)✓ Frontend UI image built$(NC)"

build-no-cache: ## Build all images without cache
	@echo "$(BLUE)Building all images (no cache)...$(NC)"
	docker build --no-cache -t archzero-api:latest -f archzero-api/Dockerfile archzero-api/
	docker build --no-cache -t archzero-ui:latest -f archzero-ui/Dockerfile archzero-ui/
	@echo "$(GREEN)✓ All images built (no cache)$(NC)"

##@ Production Deployment

prod-check: ## Check if .env exists
	@if [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found$(NC)"; \
		echo "Copy .env.production.example to .env and update with production values:"; \
		echo "  cp .env.production.example .env"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ .env file found$(NC)"

prod-up: prod-check ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✓ Production environment started$(NC)"
	@echo "  Waiting for services to be healthy..."
	@sleep 10
	@docker-compose -f docker-compose.prod.yml ps

prod-down: ## Stop production environment
	@echo "$(BLUE)Stopping production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Production environment stopped$(NC)"

prod-restart: prod-down prod-up ## Restart production environment

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-logs-api: ## Show API logs
	docker-compose -f docker-compose.prod.yml logs -f api

prod-logs-ui: ## Show UI logs
	docker-compose -f docker-compose.prod.yml logs -f ui

##@ Database Management

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	docker-compose -f docker-compose.prod.yml exec api ./archzero-api --migrate
	@echo "$(GREEN)✓ Migrations completed$(NC)"

db-reset: ## Reset database (WARNING: Deletes all data)
	@echo "$(RED)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.prod.yml exec api ./archzero-api --migrate-reset; \
		echo "$(GREEN)✓ Database reset$(NC)"; \
	else \
		echo "Aborted"; \
	fi

db-seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database...$(NC)"
	docker-compose -f docker-compose.prod.yml exec api ./archzero-api --seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

##@ Utilities

ps: ## Show running containers
	docker-compose -f docker-compose.prod.yml ps

stats: ## Show container resource usage
	docker stats $(shell docker-compose -f docker-compose.prod.yml ps -q)

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "$(BLUE)API Health Check:$(NC)"
	@curl -s http://localhost:8080/api/v1/health || echo "$(RED)API not responding$(NC)"
	@echo ""
	@echo "$(BLUE)UI Health Check:$(NC)"
	@curl -s http://localhost/ > /dev/null && echo "$(GREEN)✓ UI is responding$(NC)" || echo "$(RED)UI not responding$(NC)"

clean: ## Remove all containers, volumes, and images
	@echo "$(RED)WARNING: This will remove all containers, volumes, and images!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(BLUE)Cleaning up...$(NC)"; \
		docker-compose -f docker-compose.prod.yml down -v --rmi all; \
		docker system prune -f; \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	else \
		echo "Aborted"; \
	fi

##@ Development Quick Actions

dev-build-up: dev-down build prod-up ## Build and start production (for testing)

dev-quick-restart: ## Quick restart of API and UI only
	@echo "$(BLUE)Restarting API and UI...$(NC)"
	docker-compose -f docker-compose.prod.yml restart api ui
	@echo "$(GREEN)✓ API and UI restarted$(NC)"
