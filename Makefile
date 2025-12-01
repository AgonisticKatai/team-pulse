.PHONY: help setup start stop restart clean logs test build

# Default target
help: ## Show this help message
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                      TeamPulse Makefile                        ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 Global Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "^web-\|^api-\|^shared-\|^docker-\|^monitoring-\|^mcp-\|^db-" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🌐 Web App Commands:"
	@grep -E '^web-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔧 API Commands:"
	@grep -E '^api-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📚 Shared Package Commands:"
	@grep -E '^shared-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🐳 Docker Commands:"
	@grep -E '^docker-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🗄️  Database Commands:"
	@grep -E '^db-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📊 Monitoring Commands:"
	@grep -E '^monitoring-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔌 MCP Commands:"
	@grep -E '^mcp-.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Development
setup: ## First time setup (install deps + create env files + start db + init schema + seed)
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "📝 Creating environment files..."
	pnpm setup
	@echo "🐳 Starting PostgreSQL..."
	docker compose up -d
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 3
	@echo "🗄️  Initializing database schema..."
	$(MAKE) -C apps/api db-push
	@echo "🌱 Seeding database with SUPER_ADMIN..."
	$(MAKE) -C apps/api db-seed
	@echo "✅ Setup complete! Run 'make start' to begin"

start: docker-up ## Start all services (PostgreSQL + dev servers)
	@echo "🚀 Starting dev servers..."
	@echo "⚠️  Press Ctrl+C to stop"
	@pnpm exec turbo dev

stop: docker-down ## Stop all services
	@echo "🛑 Stopping dev servers... (press Ctrl+C if running)"

restart: stop start ## Restart all services

clean: ## Stop all services and remove volumes (⚠️  deletes all data)
	@echo "⚠️  This will delete all database data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "🗑️  Removing PostgreSQL data..."; \
		docker compose down -v; \
		echo "🧹 Cleaning workspace artifacts..."; \
		$(MAKE) -C apps/web clean; \
		$(MAKE) -C apps/api clean; \
		$(MAKE) -C packages/shared clean; \
		echo "✅ Cleaned!"; \
	else \
		echo "❌ Cancelled"; \
	fi

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	pnpm install

# ============================================================================
# WEB APP COMMANDS
# ============================================================================

web-help: ## Show web app commands
	@$(MAKE) -C apps/web help

web-dev: ## Start web dev server
	@$(MAKE) -C apps/web dev

web-build: ## Build web app
	@$(MAKE) -C apps/web build

web-test: ## Run web tests
	@$(MAKE) -C apps/web test

web-test-watch: ## Run web tests in watch mode
	@$(MAKE) -C apps/web test-watch

web-test-coverage: ## Run web tests with coverage
	@$(MAKE) -C apps/web test-coverage

web-storybook: ## Start Storybook
	@$(MAKE) -C apps/web storybook

web-build-storybook: ## Build Storybook
	@$(MAKE) -C apps/web build-storybook

web-preview: ## Preview web production build
	@$(MAKE) -C apps/web preview

web-lint: ## Lint web code
	@$(MAKE) -C apps/web lint

web-lint-fix: ## Lint and fix web code
	@$(MAKE) -C apps/web lint-fix

web-format: ## Format web code
	@$(MAKE) -C apps/web format

web-type-check: ## Type check web code
	@$(MAKE) -C apps/web type-check

web-clean: ## Clean web build artifacts
	@$(MAKE) -C apps/web clean

# ============================================================================
# API COMMANDS
# ============================================================================

api-help: ## Show API commands
	@$(MAKE) -C apps/api help

api-dev: ## Start API dev server
	@$(MAKE) -C apps/api dev

api-build: ## Build API
	@$(MAKE) -C apps/api build

api-start: ## Start API production server
	@$(MAKE) -C apps/api start

api-test: ## Run API tests
	@$(MAKE) -C apps/api test

api-test-watch: ## Run API tests in watch mode
	@$(MAKE) -C apps/api test-watch

api-test-coverage: ## Run API tests with coverage
	@$(MAKE) -C apps/api test-coverage

api-lint: ## Lint API code
	@$(MAKE) -C apps/api lint

api-lint-fix: ## Lint and fix API code
	@$(MAKE) -C apps/api lint-fix

api-format: ## Format API code
	@$(MAKE) -C apps/api format

api-type-check: ## Type check API code
	@$(MAKE) -C apps/api type-check

api-clean: ## Clean API build artifacts
	@$(MAKE) -C apps/api clean

# ============================================================================
# SHARED PACKAGE COMMANDS
# ============================================================================

shared-help: ## Show shared package commands
	@$(MAKE) -C packages/shared help

shared-dev: ## Build shared package in watch mode
	@$(MAKE) -C packages/shared dev

shared-build: ## Build shared package
	@$(MAKE) -C packages/shared build

shared-test: ## Run shared tests
	@$(MAKE) -C packages/shared test

shared-test-watch: ## Run shared tests in watch mode
	@$(MAKE) -C packages/shared test-watch

shared-test-coverage: ## Run shared tests with coverage
	@$(MAKE) -C packages/shared test-coverage

shared-lint: ## Lint shared code
	@$(MAKE) -C packages/shared lint

shared-lint-fix: ## Lint and fix shared code
	@$(MAKE) -C packages/shared lint-fix

shared-format: ## Format shared code
	@$(MAKE) -C packages/shared format

shared-type-check: ## Type check shared code
	@$(MAKE) -C packages/shared type-check

shared-validate-imports: ## Validate ESM imports
	@$(MAKE) -C packages/shared validate-imports

shared-clean: ## Clean shared build artifacts
	@$(MAKE) -C packages/shared clean

# ============================================================================
# DOCKER COMMANDS
# ============================================================================

docker-up: ## Start PostgreSQL with Docker Compose
	@echo "🐳 Starting PostgreSQL..."
	@docker compose up -d
	@sleep 2
	@echo "✅ PostgreSQL is running"

docker-down: ## Stop PostgreSQL
	@echo "🛑 Stopping PostgreSQL..."
	@docker compose down
	@echo "✅ PostgreSQL stopped"

docker-logs: ## Show PostgreSQL logs
	@docker compose logs -f

docker-ps: ## Show running Docker containers
	@docker compose ps

docker-build: ## Build production Docker image
	@echo "🐳 Building production Docker image..."
	@docker build -t team-pulse-api:latest -f apps/api/Dockerfile .

docker-run: ## Run production Docker container
	@echo "🚀 Running production Docker container..."
	@docker run -d --name team-pulse-api \
		-p 3000:3000 \
		--env-file apps/api/.env \
		team-pulse-api:latest

docker-stop: ## Stop production Docker container
	@echo "🛑 Stopping production Docker container..."
	@docker stop team-pulse-api || true
	@docker rm team-pulse-api || true

docker-clean: ## Remove Docker image and container
	@echo "🧹 Cleaning Docker resources..."
	@docker stop team-pulse-api || true
	@docker rm team-pulse-api || true
	@docker rmi team-pulse-api:latest || true

docker-size: ## Show Docker image size
	@echo "📊 Docker image size:"
	@docker images team-pulse-api:latest

# ============================================================================
# DATABASE COMMANDS
# ============================================================================

db-push: ## Push schema changes to database
	@$(MAKE) -C apps/api db-push

db-studio: ## Open Drizzle Studio (database GUI)
	@$(MAKE) -C apps/api db-studio

db-seed: ## Seed database with SUPER_ADMIN
	@$(MAKE) -C apps/api db-seed

db-migrate: ## Generate migration files
	@$(MAKE) -C apps/api db-migrate

db-migrate-run: ## Run migrations
	@$(MAKE) -C apps/api db-migrate-run

db-generate: ## Generate migration from schema
	@$(MAKE) -C apps/api db-generate

db-shell: ## Open PostgreSQL shell
	@echo "🐚 Opening PostgreSQL shell..."
	@docker compose exec postgres psql -U teampulse -d teampulse

db-reset: ## Reset database (drop all data and recreate schema)
	@echo "⚠️  Resetting database..."
	@docker compose down -v
	@docker compose up -d
	@sleep 3
	@$(MAKE) -C apps/api db-push
	@echo "✅ Database reset complete!"

db-logs: ## Show PostgreSQL logs
	@docker compose logs -f postgres

# ============================================================================
# GLOBAL TESTING & QUALITY COMMANDS
# ============================================================================

test: ## Run all tests (using Turborepo)
	@echo "🧪 Running all tests..."
	@pnpm exec turbo test

test-watch: ## Run all tests in watch mode
	@echo "🧪 Running all tests in watch mode..."
	@pnpm exec turbo test:watch

test-coverage: ## Run all tests with coverage
	@echo "🧪 Running all tests with coverage..."
	@pnpm exec turbo test:coverage

lint: ## Lint all code (using Turborepo)
	@echo "🔍 Linting..."
	@pnpm exec turbo lint

lint-fix: ## Lint and fix all code
	@echo "🔧 Linting and fixing..."
	@pnpm exec turbo lint:fix

format: ## Format all code
	@echo "💅 Formatting..."
	@pnpm exec turbo format

type-check: ## Run TypeScript type checking
	@echo "📘 Type checking..."
	@pnpm exec turbo type-check

validate-imports: ## Validate ESM imports have .js extensions
	@$(MAKE) -C packages/shared validate-imports

# ============================================================================
# BUILD COMMANDS
# ============================================================================

build: ## Build all packages and apps (using Turborepo)
	@echo "🏗️  Building all packages and apps..."
	@pnpm exec turbo build

# ============================================================================
# MONITORING COMMANDS
# ============================================================================

monitoring-up: ## Start Prometheus and Grafana
	@docker compose up prometheus grafana -d

monitoring-down: ## Stop Prometheus and Grafana
	@docker compose stop prometheus grafana

monitoring-logs: ## View all monitoring logs
	@docker compose logs -f prometheus grafana

prometheus-logs: ## View Prometheus logs
	@docker compose logs -f prometheus

grafana-logs: ## View Grafana logs
	@docker compose logs -f grafana

metrics: ## Check metrics endpoint
	@echo "Fetching metrics from http://localhost:3001/metrics..."
	@curl -s http://localhost:3001/metrics | head -n 50

# ============================================================================
# MCP COMMANDS
# ============================================================================

# Global MCP commands
mcp-build: ## Build all MCP servers
	@echo "🔧 Building all MCP servers..."
	@$(MAKE) -C packages/mcp-database build
	@$(MAKE) -C packages/mcp-testing build

mcp-dev: ## Build MCP servers in watch mode
	@echo "🔧 Building MCP servers in watch mode..."
	@pnpm --filter "@team-pulse/mcp-*" dev

mcp-clean: ## Clean MCP server build artifacts
	@echo "🧹 Cleaning MCP server build artifacts..."
	@$(MAKE) -C packages/mcp-database clean
	@$(MAKE) -C packages/mcp-testing clean

mcp-add: ## Add MCPs to Claude CLI (run after mcp-build)
	@echo "➕ Adding MCPs to Claude CLI..."
	@claude mcp add --transport stdio team-pulse-database -- node packages/mcp-database/dist/index.js
	@claude mcp add --transport stdio team-pulse-testing -- node packages/mcp-testing/dist/index.js
	@echo "✅ MCPs added! Run 'make mcp-list' to verify"

mcp-list: ## List configured MCP servers in Claude CLI
	@echo "📋 Configured MCP servers:"
	@claude mcp list

mcp-remove: ## Remove MCPs from Claude CLI
	@echo "➖ Removing MCPs from Claude CLI..."
	@claude mcp remove team-pulse-database
	@claude mcp remove team-pulse-testing
	@echo "✅ MCPs removed!"

# MCP Database commands
mcp-database-help: ## Show MCP Database commands
	@$(MAKE) -C packages/mcp-database help

mcp-database-dev: ## Build MCP Database in watch mode
	@$(MAKE) -C packages/mcp-database dev

mcp-database-build: ## Build MCP Database server
	@$(MAKE) -C packages/mcp-database build

mcp-database-start: ## Start MCP Database server
	@$(MAKE) -C packages/mcp-database start

mcp-database-clean: ## Clean MCP Database build artifacts
	@$(MAKE) -C packages/mcp-database clean

mcp-database-lint: ## Lint MCP Database code
	@$(MAKE) -C packages/mcp-database lint

mcp-database-lint-fix: ## Lint and fix MCP Database code
	@$(MAKE) -C packages/mcp-database lint-fix

mcp-database-format: ## Format MCP Database code
	@$(MAKE) -C packages/mcp-database format

# MCP Testing commands
mcp-testing-help: ## Show MCP Testing commands
	@$(MAKE) -C packages/mcp-testing help

mcp-testing-dev: ## Build MCP Testing in watch mode
	@$(MAKE) -C packages/mcp-testing dev

mcp-testing-build: ## Build MCP Testing server
	@$(MAKE) -C packages/mcp-testing build

mcp-testing-start: ## Start MCP Testing server
	@$(MAKE) -C packages/mcp-testing start

mcp-testing-clean: ## Clean MCP Testing build artifacts
	@$(MAKE) -C packages/mcp-testing clean

mcp-testing-lint: ## Lint MCP Testing code
	@$(MAKE) -C packages/mcp-testing lint

mcp-testing-lint-fix: ## Lint and fix MCP Testing code
	@$(MAKE) -C packages/mcp-testing lint-fix

mcp-testing-format: ## Format MCP Testing code
	@$(MAKE) -C packages/mcp-testing format

# ============================================================================
# SHORTCUTS & ALIASES
# ============================================================================

dev: start ## Alias for 'start'
logs: docker-logs ## Alias for docker-logs
ps: docker-ps ## Alias for docker-ps
sb: web-storybook ## Alias for web-storybook
tw: test-watch ## Alias for test-watch
