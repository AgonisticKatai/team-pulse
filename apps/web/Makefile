.PHONY: help dev build test test-watch test-coverage test-ui lint lint-fix format type-check storybook build-storybook preview clean

# Default target
help: ## Show available commands
	@echo "Web App - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Development
dev: ## Start dev server
	@echo "🚀 Starting dev server..."
	@pnpm exec vite

build: ## Build for production
	@echo "🏗️  Building for production..."
	@pnpm exec tsc && pnpm exec vite build

preview: ## Preview production build
	@echo "👀 Previewing production build..."
	@pnpm exec vite preview

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist .turbo node_modules/.vite storybook-static

# Testing
test: ## Run tests
	@echo "🧪 Running tests..."
	@pnpm exec vitest run

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	@pnpm exec vitest

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	@pnpm exec vitest run --coverage

test-ui: ## Run tests with UI
	@echo "🎨 Opening Vitest UI..."
	@pnpm exec vitest --ui

# Storybook
storybook: ## Start Storybook dev server
	@echo "📚 Starting Storybook..."
	@pnpm exec storybook dev -p 6006

build-storybook: ## Build Storybook for production
	@echo "📦 Building Storybook..."
	@pnpm exec storybook build

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
sb: storybook ## Alias for storybook
tw: test-watch ## Alias for test-watch
