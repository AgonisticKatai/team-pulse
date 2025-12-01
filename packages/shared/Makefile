.PHONY: help dev build test test-watch test-coverage lint lint-fix format type-check validate-imports clean

# Default target
help: ## Show available commands
	@echo "Shared Package - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Development
dev: ## Build in watch mode
	@echo "🔧 Building in watch mode..."
	@pnpm exec tsc --build --watch

build: ## Build package
	@echo "🏗️  Building package..."
	@pnpm exec tsc --build

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist tsconfig.tsbuildinfo

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

validate-imports: ## Validate ESM imports have .js extensions
	@echo "🔍 Validating ESM imports..."
	@bash ./scripts/validate-imports.sh

# Shortcuts
tw: test-watch ## Alias for test-watch
