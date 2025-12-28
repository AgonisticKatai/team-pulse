.PHONY: help dev build start test test-watch test-coverage test-ui lint lint-fix format type-check clean db-push db-studio db-seed db-migrate db-migrate-run db-generate

# Default target
help: ## Show available commands
	@echo "API - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Development
dev: ## Start API dev server (with watch)
	@echo "🚀 Starting API dev server..."
	@pnpm exec tsx watch --env-file=.env src/index.ts

build: ## Build for production
	@echo "🏗️  Building for production..."
	@pnpm exec tsc

start: ## Start production server
	@echo "🚀 Starting production server..."
	@node --env-file=.env dist/index.js

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist node_modules/.vite

# Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	@pnpm exec vitest run

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	@pnpm exec vitest

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	@pnpm exec vitest run --coverage

test-ui: ## Run tests with UI
	@echo "🎨 Opening Vitest UI..."
	@pnpm exec vitest --ui

# Database
db-push: ## Push schema changes to database
	@echo "🗄️  Pushing schema to database..."
	@pnpm exec drizzle-kit push

db-studio: ## Open Drizzle Studio (database GUI)
	@echo "🎨 Opening Drizzle Studio..."
	@pnpm exec drizzle-kit studio

db-seed: ## Seed database with SUPER_ADMIN
	@echo "🌱 Seeding database..."
	@pnpm exec tsx --env-file=.env src/scripts/seed-super-admin.ts

db-migrate: ## Generate migration files
	@echo "📝 Generating migration..."
	@pnpm exec drizzle-kit migrate

db-migrate-run: ## Run migrations (with .env)
	@echo "🚀 Running migrations..."
	@pnpm exec tsx --env-file=.env src/scripts/run-migrations.ts

db-generate: ## Generate migration from schema
	@echo "📝 Generating migration from schema..."
	@pnpm exec drizzle-kit generate

# Code Quality
lint: ## Lint code
	@echo "🔍 Linting code..."
	@pnpm exec biome check .

lint-fix: ## Lint and fix code
	@echo "🔧 Linting and fixing code..."
	@pnpm exec biome check --write .

format: ## Format code
	@echo "💅 Formatting code..."
	@pnpm exec biome format --write .

type-check: ## Run TypeScript type checking
	@echo "📘 Type checking..."
	@pnpm exec tsc --noEmit

# Shortcuts
tw: test-watch ## Alias for test-watch
