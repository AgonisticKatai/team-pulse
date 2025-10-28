.PHONY: help setup start stop restart clean logs db-push db-studio db-reset test build

# Default target
help: ## Show this help message
	@echo "TeamPulse - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Development
setup: ## First time setup (install deps + create env files + start db + init schema)
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "📝 Creating environment files..."
	pnpm setup
	@echo "🐳 Starting PostgreSQL..."
	docker compose up -d
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 3
	@echo "🗄️  Initializing database schema..."
	pnpm --filter @team-pulse/api db:push
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
		echo "✅ Cleaned!"; \
	else \
		echo "❌ Cancelled"; \
	fi

# Docker
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

# Database
db-push: ## Push schema changes to database
	@echo "🗄️  Pushing schema to database..."
	pnpm --filter @team-pulse/api db:push

db-studio: ## Open Drizzle Studio (database GUI)
	@echo "🎨 Opening Drizzle Studio..."
	pnpm --filter @team-pulse/api db:studio

db-shell: ## Open PostgreSQL shell
	@echo "🐚 Opening PostgreSQL shell..."
	@docker compose exec postgres psql -U teampulse -d teampulse

db-reset: ## Reset database (drop all data and recreate schema)
	@echo "⚠️  Resetting database..."
	@docker compose down -v
	@docker compose up -d
	@sleep 3
	@pnpm --filter @team-pulse/api db:push
	@echo "✅ Database reset complete!"

db-logs: ## Show PostgreSQL logs (alias for docker-logs)
	@docker compose logs -f postgres

# Development helpers
logs: docker-logs ## Alias for docker-logs

ps: docker-ps ## Alias for docker-ps

# Testing & Quality
test: ## Run all tests
	@echo "🧪 Running tests..."
	@pnpm exec turbo test

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	@pnpm exec turbo test:watch

test-coverage: ## Run tests with coverage
	@echo "🧪 Running tests with coverage..."
	@pnpm exec turbo test:coverage

lint: ## Lint all code
	@echo "🔍 Linting..."
	@pnpm exec turbo lint

lint-fix: ## Lint and fix all code
	@echo "🔧 Linting and fixing..."
	@pnpm exec turbo lint:fix

type-check: ## Run TypeScript type checking
	@echo "📘 Type checking..."
	@pnpm exec turbo type-check

# Build
build: ## Build all apps for production
	@echo "🏗️  Building for production..."
	@pnpm exec turbo build

# Quick commands
dev: start ## Alias for 'start'

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	pnpm install
