.PHONY: help dev build start clean lint lint-fix format

help: ## Show this help message
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔌 MCP Database Server Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

dev: ## Build in watch mode
	@echo "🔧 Building MCP Database server in watch mode..."
	@pnpm exec tsc --build --watch

build: ## Build the server
	@echo "📦 Building MCP Database server..."
	@pnpm exec tsc --build

start: ## Start the server
	@echo "🚀 Starting MCP Database server..."
	@node dist/index.js

clean: ## Clean build artifacts
	@echo "🧹 Cleaning MCP Database build artifacts..."
	@rm -rf dist tsconfig.tsbuildinfo

lint: ## Lint code
	@echo "🔍 Linting MCP Database code..."
	@pnpm exec biome check .

lint-fix: ## Lint and fix code
	@echo "🔧 Linting and fixing MCP Database code..."
	@pnpm exec biome check --write .

format: ## Format code
	@echo "✨ Formatting MCP Database code..."
	@pnpm exec biome format --write .
