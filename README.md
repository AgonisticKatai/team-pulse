# ⚽ TeamPulse

[![CI](https://github.com/AgonisticKatai/team-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/AgonisticKatai/team-pulse/actions/workflows/ci.yml)
[![Deploy](https://github.com/AgonisticKatai/team-pulse/actions/workflows/deploy.yml/badge.svg)](https://github.com/AgonisticKatai/team-pulse/actions/workflows/deploy.yml)

Modern football team statistics platform with real-time match tracking, admin dashboard and analytics.

**🌐 Live Demo**: [Coming soon after deployment]

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Backend**: Fastify (local) / Vercel Serverless Functions (production)
- **Styling**: CSS Custom Properties (native)
- **Tooling**: Biome (linting + formatting)
- **Monorepo**: Turborepo + pnpm workspaces
- **Deployment**: Vercel
- **Architecture**: Hexagonal Architecture (Ports & Adapters)

## 📦 Project Structure

```
team-pulse/
├── apps/
│   ├── web/          # Frontend React application
│   └── api/          # Backend API (local development)
├── api/              # Vercel Serverless Functions (production)
├── packages/
│   └── shared/       # Shared types and domain logic
├── turbo.json        # Turborepo configuration
├── vercel.json       # Vercel configuration
└── package.json      # Monorepo root
```

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install pnpm globally if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install

# Approve Biome build scripts
pnpm approve-builds @biomejs/biome
pnpm install

# Start development servers (uses Turborepo)
pnpm dev
```

### Development

- Frontend will run on: `http://localhost:5173`
- API will run on: `http://localhost:3000`

### Available Commands

All commands use Turborepo for optimal caching and parallelization:

```bash
pnpm dev             # Start all apps in development mode
pnpm build           # Build all apps for production
pnpm test            # Run all tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage report
pnpm lint            # Lint all workspaces
pnpm lint:fix        # Auto-fix linting issues
pnpm format          # Format code
pnpm type-check      # TypeScript type checking
```

## 🚀 Deployment

This project uses Turborepo and is optimized for Vercel deployment with automatic CI/CD via GitHub Actions.

### Automatic Deployment (Recommended)

Every push to `main` automatically:
1. ✅ Runs CI pipeline (lint, type-check, tests, build)
2. 🚀 Deploys to Vercel production

### Setting up GitHub Secrets

For automatic deployment, add these secrets to your GitHub repository:

1. Go to `Settings > Secrets and variables > Actions`
2. Add the following secrets:

```bash
VERCEL_TOKEN          # From Vercel account settings
VERCEL_ORG_ID         # From Vercel project settings (.vercel/project.json)
VERCEL_PROJECT_ID     # From Vercel project settings (.vercel/project.json)
```

### Manual Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Turborepo configuration
4. Deploy!

### Manual Configuration (if needed)

```
Framework Preset: Other
Root Directory: .
Build Command: turbo build
Output Directory: apps/web/dist
Install Command: pnpm install
Node.js Version: 22.x
```

## 📝 Features (Coming Soon)

- [ ] Admin authentication
- [ ] Match management (create, edit, delete)
- [ ] Real-time match data entry
- [ ] Player statistics
- [ ] Team analytics dashboard
- [ ] Mobile-responsive design

## 🔒 Git Hooks & Code Quality

This project uses **Husky** and **lint-staged** to ensure code quality before commits.

### Automatic Checks

**Pre-commit** (runs automatically before each commit):
- 🎨 Lint and format changed files (Biome)
- 🔎 TypeScript type checking

**Commit-msg** (validates commit message format):
- 📝 Enforces [Conventional Commits](https://www.conventionalcommits.org/)
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Pre-push** (runs before pushing to remote):
- 🧪 All tests must pass

### Commit Message Format

```bash
<type>(<scope>): <subject>

# Examples:
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
test: add unit tests for match service
```

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit and commit-msg (NOT RECOMMENDED)
git commit --no-verify -m "message"

# Skip pre-push (NOT RECOMMENDED)
git push --no-verify
```

## 🏗️ Architecture

This project follows **Hexagonal Architecture** principles with:
- Domain-driven design (DDD)
- Test-driven development (TDD)
- Clean separation of concerns
- Framework-agnostic business logic

## 🎨 Design System

Built with native CSS custom properties:
- **Colors**: RGB tokens for flexible transparency
- **Spacing**: Consistent scale (xs to 2xl)
- **Typography**: Type scale with line-height variants
- **Modern CSS**: Nesting, container queries, range syntax

## 🚀 Turborepo Benefits

- ⚡ Smart caching of build outputs
- 🔄 Parallel task execution
- 📦 Optimized for CI/CD
- 🎯 Perfect Vercel integration

## 📄 License

MIT
