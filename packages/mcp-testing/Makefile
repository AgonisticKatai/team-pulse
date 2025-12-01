.PHONY: help dev build start clean lint lint-fix format

help: ## Show this help message
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🔌 MCP Testing Server Commands"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

dev: ## Build in watch mode
	@echo "🔧 Building MCP Testing server in watch mode..."
	@pnpm exec tsc --build --watch

build: ## Build the server
	@echo "📦 Building MCP Testing server..."
	@pnpm exec tsc --build

start: ## Start the server
	@echo "🚀 Starting MCP Testing server..."
	@node dist/index.js

clean: ## Clean build artifacts
	@echo "🧹 Cleaning MCP Testing build artifacts..."
	@rm -rf dist tsconfig.tsbuildinfo

lint: ## Lint code
	@echo "🔍 Linting MCP Testing code..."
	@pnpm exec biome check .

lint-fix: ## Lint and fix code
	@echo "🔧 Linting and fixing MCP Testing code..."
	@pnpm exec biome check --write .

format: ## Format code
	@echo "✨ Formatting MCP Testing code..."
	@pnpm exec biome format --write .
