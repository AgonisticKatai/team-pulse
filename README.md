# ⚽ TeamPulse

[![CI](https://github.com/AgonisticKatai/team-pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/AgonisticKatai/team-pulse/actions/workflows/ci.yml)
[![Deploy](https://github.com/AgonisticKatai/team-pulse/actions/workflows/deploy.yml/badge.svg)](https://github.com/AgonisticKatai/team-pulse/actions/workflows/deploy.yml)

Modern football team statistics platform with real-time match tracking, admin dashboard and analytics.

**🌐 Live Demo**: [Coming soon after deployment]

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 6
- **Backend**: Fastify (local) / Vercel Serverless Functions (production)
- **Database**: PostgreSQL (with Drizzle ORM)
- **Authentication**: JWT with Refresh Tokens + bcrypt password hashing
- **Authorization**: Role-based access control (RBAC)
- **Styling**: CSS Custom Properties (native)
- **Testing**: Vitest (56+ unit tests)
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

- Node.js >= 22.0.0
- pnpm >= 10.0.0
- Docker and Docker Compose (for local database)

### Database Setup

This project uses **PostgreSQL** for all environments (development, tests, and production).

**Start PostgreSQL with Docker Compose:**

```bash
# Start PostgreSQL in the background
docker compose up -d

# Check the container is running
docker compose ps
```

The database will be available at:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `teampulse`
- **User**: `teampulse`
- **Password**: `teampulse`

**Useful Docker commands:**

```bash
docker compose down           # Stop PostgreSQL
docker compose down -v        # Stop and remove data (reset database)
docker compose logs -f        # View PostgreSQL logs
```

### Installation

#### Option 1: Using Makefile (Recommended) ⭐

```bash
# One command setup (first time only)
make setup

# Start development
make start
```

#### Option 2: Manual Setup

```bash
# Install pnpm globally if you don't have it
npm install -g pnpm

# Install dependencies
pnpm install

# Create environment file for API
pnpm setup

# Start PostgreSQL
pnpm docker:up

# Initialize database schema
pnpm db:push

# Start development servers
pnpm dev
```

**Note**: The `pnpm setup` command creates `apps/api/.env` from `.env.example` with the correct DATABASE_URL already configured for Docker PostgreSQL (`postgresql://teampulse:teampulse@localhost:5432/teampulse`).

### Development

The development servers will be available at:
- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:3000`
- **Database**: `postgresql://teampulse:teampulse@localhost:5432/teampulse`

#### Quick Start Commands

**Using Makefile:**
```bash
make start        # Start everything (PostgreSQL + dev servers)
make stop         # Stop all services
make restart      # Restart all services
make help         # Show all available commands
```

**Using pnpm:**
```bash
pnpm docker:up    # Start PostgreSQL
pnpm db:push      # Initialize/update database schema
pnpm dev          # Start dev servers
pnpm docker:down  # Stop PostgreSQL
```

### Available Commands

#### Makefile Commands

Run `make help` to see all available commands. Most useful:

```bash
# Development
make start           # Start all services (PostgreSQL + dev servers)
make stop            # Stop all services
make restart         # Restart all services
make setup           # First time setup (deps + env + db)

# Database
make db-push         # Push schema changes to database
make db-studio       # Open Drizzle Studio (database GUI)
make db-reset        # Reset database (⚠️ deletes all data)
make db-logs         # Show PostgreSQL logs
make shell           # Open PostgreSQL shell

# Development Helpers
make logs            # Show all Docker logs
make ps              # Show running containers
make clean           # Stop and remove all data (⚠️ destructive)

# Testing & Quality
make test            # Run all tests
make test-watch      # Run tests in watch mode
make test-coverage   # Run tests with coverage
make lint            # Lint all code
make lint-fix        # Lint and fix all code
make type-check      # Run TypeScript type checking

# Build
make build           # Build all apps for production
```

#### pnpm Scripts

All commands use Turborepo for optimal caching and parallelization:

```bash
# Development
pnpm dev             # Start all apps in development mode
pnpm build           # Build all apps for production

# Testing
pnpm test            # Run all tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage report

# Code Quality
pnpm lint            # Lint all workspaces
pnpm lint:fix        # Auto-fix linting issues
pnpm format          # Format code
pnpm type-check      # TypeScript type checking

# Docker
pnpm docker:up       # Start PostgreSQL
pnpm docker:down     # Stop PostgreSQL
pnpm docker:logs     # Show PostgreSQL logs
pnpm docker:ps       # Show running containers

# Database
pnpm db:push         # Push schema changes to database
pnpm db:studio       # Open Drizzle Studio (database GUI)
pnpm db:shell        # Open PostgreSQL shell
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

## 📝 Features

### ✅ Implemented

- [x] **Authentication & Authorization**: JWT-based auth with 3-tier RBAC (SUPER_ADMIN, ADMIN, USER)
- [x] **User Management**: Create and list users with role-based permissions
- [x] **Team Management**: CRUD operations with role-based access control

### 🚧 Coming Soon

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

This project follows **Hexagonal Architecture** (Ports & Adapters) principles with:

### Layers
- **Domain Layer**: Business entities and rules (framework-agnostic)
- **Application Layer**: Use cases and business logic orchestration
- **Infrastructure Layer**: Adapters for external systems (HTTP, Database, etc.)

### Benefits
- Domain-driven design (DDD)
- Test-driven development (TDD)
- Clean separation of concerns
- Framework-agnostic business logic
- Easy to swap implementations (e.g., different databases or HTTP frameworks)
- Highly testable with dependency injection

### Project Structure
```
apps/api/src/
├── domain/              # Entities, value objects, domain errors
│   ├── models/
│   ├── repositories/    # Repository interfaces (ports)
│   └── errors/
├── application/         # Use cases, DTOs, business orchestration
│   ├── use-cases/
│   └── dtos/
└── infrastructure/      # Adapters (implementations)
    ├── database/        # Drizzle ORM, repositories
    ├── http/            # Fastify routes, controllers
    └── config/          # DI container, env validation
```

## 🔐 Authentication & Authorization

TeamPulse uses **JWT-based authentication** with refresh tokens and **role-based access control (RBAC)**.

### Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **Access Tokens**: JWT, 15 minutes expiration
- **Refresh Tokens**: JWT, 7 days expiration, stored in database
- **Token Rotation**: New refresh token on each refresh

### Role Hierarchy

| Role | Level | Permissions |
|------|-------|-------------|
| `SUPER_ADMIN` | 3 | Full system access (god mode) |
| `ADMIN` | 2 | Can create users and manage teams |
| `USER` | 1 | Read-only access to teams |

### First Setup

Seed the first SUPER_ADMIN user:

```bash
make db-seed
```

**Default credentials:**
- Email: `admin@teampulse.com`
- Password: `Admin123!`

⚠️ **Change these credentials immediately in production!**

### API Authentication Flow

```
1. Login: POST /api/auth/login
   → Returns: { accessToken, refreshToken, user }

2. Use token: Header: Authorization: Bearer <accessToken>

3. Refresh: POST /api/auth/refresh (when token expires)

4. Logout: POST /api/auth/logout
```

### Testing Coverage

95+ tests covering authentication and authorization:
- Password utilities, JWT utilities, domain entities
- Auth endpoints, RBAC protection
- Run: `make test`

## 🧪 Test Containers - True Parallel Test Isolation

TeamPulse uses **Docker-based test containers** to achieve true test isolation, enabling parallel test execution without race conditions.

### Architecture Comparison

```mermaid
graph TB
    subgraph traditional["❌ Traditional Approach - Shared Database"]
        SharedDB[(PostgreSQL<br/>localhost:5432)]
        TestA1[Test A<br/>Truncate users]
        TestB1[Test B<br/>Truncate users]
        TestC1[Test C<br/>Truncate users]

        TestA1 -.->|Race<br/>Condition| SharedDB
        TestB1 -.->|Race<br/>Condition| SharedDB
        TestC1 -.->|Race<br/>Condition| SharedDB

        SharedDB -.->|Conflicts| TestA1
        SharedDB -.->|Conflicts| TestB1
        SharedDB -.->|Conflicts| TestC1
    end

    subgraph containers["✅ Test Containers - Isolated Databases"]
        TestA2[Test Suite A<br/>auth.test.ts]
        TestB2[Test Suite B<br/>protected.test.ts]
        TestC2[Test Suite C<br/>teams.test.ts]

        DBA[(PostgreSQL<br/>:49153<br/>Container 1)]
        DBB[(PostgreSQL<br/>:49154<br/>Container 2)]
        DBC[(PostgreSQL<br/>:49155<br/>Container 3)]

        TestA2 ==>|Isolated| DBA
        TestB2 ==>|Isolated| DBB
        TestC2 ==>|Isolated| DBC
    end

    style traditional fill:#ffe6e6
    style containers fill:#e6ffe6
    style SharedDB fill:#ff6b6b
    style DBA fill:#51cf66
    style DBB fill:#51cf66
    style DBC fill:#51cf66
```

### Test Container Lifecycle

```mermaid
sequenceDiagram
    participant Test as Test Suite
    participant TC as setupTestContainer()
    participant Docker as Docker Engine
    participant PG as PostgreSQL Container
    participant DB as Database Instance

    Note over Test,DB: beforeAll Hook (runs once per suite)
    Test->>TC: setupTestContainer()
    TC->>Docker: Start PostgreSQL container
    Docker->>PG: Create container (random port)
    PG->>PG: Initialize PostgreSQL
    TC->>DB: Push schema (drizzle-kit)
    DB-->>TC: Schema ready
    TC-->>Test: Return {db, cleanup}

    Note over Test,DB: beforeEach Hook (runs per test)
    Test->>DB: TRUNCATE all tables
    Test->>DB: Insert test data
    Test->>Test: Run test assertions

    Note over Test,DB: afterEach Hook
    Test->>Test: Close app & container connections

    Note over Test,DB: afterAll Hook (cleanup)
    Test->>TC: cleanup()
    TC->>Docker: Stop container
    Docker->>PG: Remove container
    PG-->>Test: Resources freed
```

### How It Works

Each test suite gets its own PostgreSQL container:

```typescript
describe('Auth Tests', () => {
  let db: Database
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    // 1. Start isolated PostgreSQL container (auto port)
    const result = await setupTestContainer()
    db = result.db // postgresql://localhost:49153/test
    cleanup = result.cleanup
  }, 120_000) // 2 minute timeout for container startup

  beforeEach(async () => {
    // 2. Clean only this test's database
    await db.execute(sql`TRUNCATE TABLE users, teams ...`)

    // 3. Setup test data (no conflicts with other tests)
    await createTestUser('user@test.com')
  })

  it('should authenticate user', async () => {
    // Test runs with isolated database
  })

  afterAll(async () => {
    // 4. Stop and remove container
    await cleanup()
  })
})
```

### Benefits

1. **True Isolation**: Each test suite has its own database instance
2. **Parallel Execution**: Tests run in parallel safely (17s vs 30s+ sequential)
3. **Zero Race Conditions**: No shared state = no conflicts
4. **Production-Like**: Tests run against real PostgreSQL instances
5. **Best Practices**: Industry-standard approach for integration testing

### Test Results

```bash
$ make test

✓ 99 tests passed (7 test files)
  - auth.test.ts (16 tests)
  - protected.test.ts (23 tests)
  - Domain models (34 tests)
  - Utilities (26 tests)

Duration: 17.43s (parallel execution)
```

### Requirements

- Docker must be running
- Testcontainers automatically manages container lifecycle
- Containers are created on `beforeAll` and destroyed on `afterAll`

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
