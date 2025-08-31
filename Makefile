# N8N-Work Platform Makefile
# This Makefile provides common development and deployment tasks

# Variables
PROJECT_NAME := n8n-work
VERSION := $(shell git describe --tags --always --dirty)
BUILD_DATE := $(shell date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT := $(shell git rev-parse --short HEAD)
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

# Docker
DOCKER_REGISTRY := n8nwork
DOCKER_NAMESPACE := platform
DOCKER_TAG := $(VERSION)

# Services
SERVICES := orchestrator-nest engine-nest node-runner-js
SHARED_LIBS := shared contracts

# Environment
ENV := development
NODE_ENV := development

# Database
DB_NAME := n8n_ai
DB_USER := n8n_ai
DB_PASSWORD := n8n_ai_dev

# Ports
ORCHESTRATOR_PORT := 3000
ENGINE_PORT := 8080
NODE_RUNNER_PORT := 3002

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
NC := \033[0m # No Color

# Help
.PHONY: help
help: ## Show this help message
	@echo "$(CYAN)N8N-Work Platform Development Commands$(NC)"
	@echo "$(YELLOW)Usage: make [target]$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development Setup
.PHONY: setup
setup: ## Initial setup of the development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@make install-deps
	@make build-shared
	@make db-setup
	@make generate-keys
	@echo "$(GREEN)Setup completed successfully!$(NC)"

.PHONY: install-deps
install-deps: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Installing dependencies for $$service...$(NC)"; \
		cd $$service && npm install && cd ..; \
	done
	@for lib in $(SHARED_LIBS); do \
		echo "$(YELLOW)Installing dependencies for $$lib...$(NC)"; \
		cd $$lib && npm install && cd ..; \
	done

.PHONY: build-shared
build-shared: ## Build shared libraries
	@echo "$(BLUE)Building shared libraries...$(NC)"
	@cd shared && npm run build
	@cd contracts && npm run build

# Database
.PHONY: db-setup
db-setup: ## Setup database and run migrations
	@echo "$(BLUE)Setting up database...$(NC)"
	@docker-compose up -d postgres redis rabbitmq
	@sleep 5
	@make db-migrate
	@make db-seed

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@cd orchestrator-nest && npm run migration:run

.PHONY: db-seed
db-seed: ## Seed database with initial data
	@echo "$(BLUE)Seeding database...$(NC)"
	@cd orchestrator-nest && npm run seed

.PHONY: db-reset
db-reset: ## Reset database (drop and recreate)
	@echo "$(RED)Resetting database...$(NC)"
	@docker-compose down -v
	@docker-compose up -d postgres redis rabbitmq
	@sleep 5
	@make db-migrate
	@make db-seed

# Development
.PHONY: dev
dev: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "$(CYAN)Services:$(NC)"
	@echo "  - Orchestrator: http://localhost:$(ORCHESTRATOR_PORT)"
	@echo "  - Engine: http://localhost:$(ENGINE_PORT)"
	@echo "  - Node Runner: http://localhost:$(NODE_RUNNER_PORT)"
	@echo "  - RabbitMQ: http://localhost:15672"
	@echo "  - Redis: localhost:6379"

.PHONY: dev-services
dev-services: ## Start services in development mode
	@echo "$(BLUE)Starting services in development mode...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Starting $$service...$(NC)"; \
		cd $$service && npm run start:dev & \
	done
	@wait

.PHONY: dev-orchestrator
dev-orchestrator: ## Start orchestrator service in development mode
	@echo "$(BLUE)Starting orchestrator service...$(NC)"
	@cd orchestrator-nest && npm run start:dev

.PHONY: dev-engine
dev-engine: ## Start engine service in development mode
	@echo "$(BLUE)Starting engine service...$(NC)"
	@cd engine-nest && npm run start:dev

.PHONY: dev-node-runner
dev-node-runner: ## Start node runner service in development mode
	@echo "$(BLUE)Starting node runner service...$(NC)"
	@cd node-runner-js && npm run start:dev

# Building
.PHONY: build
build: ## Build all services
	@echo "$(BLUE)Building all services...$(NC)"
	@make build-shared
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Building $$service...$(NC)"; \
		cd $$service && npm run build && cd ..; \
	done

.PHONY: build-prod
build-prod: ## Build all services for production
	@echo "$(BLUE)Building all services for production...$(NC)"
	@NODE_ENV=production make build

.PHONY: build-docker
build-docker: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker-compose build

# Testing
.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Testing $$service...$(NC)"; \
		cd $$service && npm test && cd ..; \
	done

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Testing $$service in watch mode...$(NC)"; \
		cd $$service && npm run test:watch & \
	done
	@wait

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Testing $$service with coverage...$(NC)"; \
		cd $$service && npm run test:cov && cd ..; \
	done

.PHONY: test-e2e
test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running end-to-end tests...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Running E2E tests for $$service...$(NC)"; \
		cd $$service && npm run test:e2e && cd ..; \
	done

# Linting and Formatting
.PHONY: lint
lint: ## Run linting on all services
	@echo "$(BLUE)Running linting...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Linting $$service...$(NC)"; \
		cd $$service && npm run lint && cd ..; \
	done

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	@echo "$(BLUE)Fixing linting issues...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Fixing linting issues in $$service...$(NC)"; \
		cd $$service && npm run lint:fix && cd ..; \
	done

.PHONY: format
format: ## Format code
	@echo "$(BLUE)Formatting code...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Formatting $$service...$(NC)"; \
		cd $$service && npm run format && cd ..; \
	done

# Docker Operations
.PHONY: docker-up
docker-up: ## Start Docker services
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d

.PHONY: docker-down
docker-down: ## Stop Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose down

.PHONY: docker-logs
docker-logs: ## Show Docker logs
	@docker-compose logs -f

.PHONY: docker-clean
docker-clean: ## Clean Docker resources
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f

# Health Checks
.PHONY: health
health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -f http://localhost:$(ORCHESTRATOR_PORT)/health || echo "$(RED)Orchestrator: DOWN$(NC)"
	@curl -f http://localhost:$(ENGINE_PORT)/health || echo "$(RED)Engine: DOWN$(NC)"
	@curl -f http://localhost:$(NODE_RUNNER_PORT)/health || echo "$(RED)Node Runner: DOWN$(NC)"

.PHONY: health-orchestrator
health-orchestrator: ## Check orchestrator health
	@curl -f http://localhost:$(ORCHESTRATOR_PORT)/health && echo "$(GREEN)Orchestrator: UP$(NC)" || echo "$(RED)Orchestrator: DOWN$(NC)"

# Security
.PHONY: generate-keys
generate-keys: ## Generate security keys
	@echo "$(BLUE)Generating security keys...$(NC)"
	@mkdir -p keys
	@openssl genrsa -out keys/private.pem 2048 2>/dev/null || echo "$(YELLOW)OpenSSL not available, skipping key generation$(NC)"
	@openssl rsa -in keys/private.pem -pubout -out keys/public.pem 2>/dev/null || echo "$(YELLOW)OpenSSL not available, skipping key generation$(NC)"

.PHONY: security-audit
security-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Auditing $$service...$(NC)"; \
		cd $$service && npm audit && cd ..; \
	done

# Monitoring
.PHONY: logs
logs: ## Show application logs
	@docker-compose logs -f --tail=100

.PHONY: logs-orchestrator
logs-orchestrator: ## Show orchestrator logs
	@docker-compose logs -f orchestrator-nest

.PHONY: logs-engine
logs-engine: ## Show engine logs
	@docker-compose logs -f engine-nest

.PHONY: logs-node-runner
logs-node-runner: ## Show node runner logs
	@docker-compose logs -f node-runner-js

# Deployment
.PHONY: deploy
deploy: ## Deploy to production
	@echo "$(BLUE)Deploying to production...$(NC)"
	@make build-prod
	@make docker-build
	@make docker-push
	@echo "$(GREEN)Deployment completed!$(NC)"

.PHONY: docker-push
docker-push: ## Push Docker images to registry
	@echo "$(BLUE)Pushing Docker images...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Pushing $$service...$(NC)"; \
		docker tag $(PROJECT_NAME)-$$service:latest $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/$$service:$(DOCKER_TAG); \
		docker push $(DOCKER_REGISTRY)/$(DOCKER_NAMESPACE)/$$service:$(DOCKER_TAG); \
	done

# Cleanup
.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Cleaning $$service...$(NC)"; \
		cd $$service && rm -rf dist node_modules && cd ..; \
	done
	@for lib in $(SHARED_LIBS); do \
		echo "$(YELLOW)Cleaning $$lib...$(NC)"; \
		cd $$lib && rm -rf dist node_modules && cd ..; \
	done

.PHONY: clean-all
clean-all: ## Clean everything including Docker
	@echo "$(BLUE)Cleaning everything...$(NC)"
	@make clean
	@make docker-clean
	@rm -rf keys

# Documentation
.PHONY: docs
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@for service in $(SERVICES); do \
		echo "$(YELLOW)Generating docs for $$service...$(NC)"; \
		cd $$service && npm run docs && cd ..; \
	done

.PHONY: docs-serve
docs-serve: ## Serve documentation
	@echo "$(BLUE)Serving documentation...$(NC)"
	@cd docs && python3 -m http.server 8080 || python -m SimpleHTTPServer 8080

# Performance
.PHONY: benchmark
benchmark: ## Run performance benchmarks
	@echo "$(BLUE)Running performance benchmarks...$(NC)"
	@cd benchmarks && npm run benchmark

.PHONY: load-test
load-test: ## Run load tests
	@echo "$(BLUE)Running load tests...$(NC)"
	@cd load-tests && npm run load-test

# Utilities
.PHONY: version
version: ## Show version information
	@echo "$(CYAN)Version Information:$(NC)"
	@echo "  Project: $(PROJECT_NAME)"
	@echo "  Version: $(VERSION)"
	@echo "  Build Date: $(BUILD_DATE)"
	@echo "  Git Commit: $(GIT_COMMIT)"
	@echo "  Git Branch: $(GIT_BRANCH)"

.PHONY: status
status: ## Show project status
	@echo "$(CYAN)Project Status:$(NC)"
	@echo "  Environment: $(ENV)"
	@echo "  Node Environment: $(NODE_ENV)"
	@echo "  Services: $(SERVICES)"
	@echo "  Shared Libraries: $(SHARED_LIBS)"

.PHONY: shell
shell: ## Open shell in orchestrator container
	@docker-compose exec orchestrator-nest /bin/bash

.PHONY: db-shell
db-shell: ## Open shell in database container
	@docker-compose exec postgres psql -U $(DB_USER) -d $(DB_NAME)

# Default target
.DEFAULT_GOAL := help