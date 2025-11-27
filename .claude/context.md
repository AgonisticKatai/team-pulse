# TeamPulse - Project Context

## 🏗️ Overall Architecture

### Project Type
**Monorepo** using **Turborepo + pnpm workspaces**

### Package Structure
```
team-pulse/
├── apps/
│   ├── api/          # Backend (Fastify local dev)
│   └── web/          # Frontend (React + Vite)
├── api/              # Vercel Serverless Functions (production)
└── packages/
    └── shared/       # Shared types, DTOs, domain logic
```

---

## 🎯 Hexagonal Architecture (Ports & Adapters)

### FUNDAMENTAL Principle
**ALWAYS respect layer separation:**

```
Domain (INNER - Core)
  ↑ depends on
Application (MIDDLE - Use Cases)
  ↑ depends on
Infrastructure (OUTER - Adapters)
  ↑ depends on
Presentation (OUTER - UI)
```

**Golden rule**: Inner layers CANNOT depend on outer layers. Only the reverse.

### Backend Structure (apps/api/src/)
```
domain/              # ⚡ Core business logic
├── models/          # Rich entities (User, Team, RefreshToken)
└── repositories/    # Interfaces (PORTS) - eg: IUserRepository

application/         # 🎯 Use cases
└── use-cases/       # Business logic orchestration (LoginUseCase, CreateTeamUseCase)

infrastructure/      # 🔌 External adapters
├── database/        # Drizzle ORM, repository implementations (ADAPTERS)
├── http/            # Fastify, routes, controllers (ADAPTERS)
├── auth/            # JWT, bcrypt
├── config/          # DI container, environment variables
└── testing/         # Testcontainers setup

# ⚡ ERRORS ARE IN SHARED PACKAGE
packages/shared/src/errors/  # All application errors (ValidationError, RepositoryError, etc.)
```

### Frontend Structure (apps/web/src/)
```
domain/              # ⚡ Business logic
├── value-objects/   # Email, Role, TeamName, EntityId, FoundedYear, City
├── types/           # Result<T, E>, error types
└── repositories/    # Interfaces (PORTS)

# ⚡ ERRORS ARE IN SHARED PACKAGE
packages/shared/src/errors/  # All application errors (shared with API)

application/         # 🎯 Application logic
├── use-cases/       # Business orchestration
├── context/         # React contexts (AuthContext)
├── hooks/           # Custom hooks
└── mappers/         # DTO → Domain mappers

infrastructure/      # 🔌 Concrete implementations
├── api/             # API clients
├── repositories/    # Repository implementations (ADAPTERS)
├── storage/         # LocalStorage
└── config/          # Container, configuration

presentation/        # 🎨 UI Layer
├── components/      # React components
└── pages/           # Pages
```

---

## 💻 Technology Stack

### Backend
- **Framework**: Fastify 5.6.1 (local dev) + Vercel Serverless (prod)
- **Database**: PostgreSQL 16 + Drizzle ORM 0.44.7
- **Authentication**: JWT + bcrypt
- **Validation**: Zod 4.1.12
- **Testing**: Vitest + Testcontainers (isolated PostgreSQL per suite)

### Frontend
- **Framework**: React 19.2.0
- **Build**: Vite 7.1.12
- **Routing**: React Router DOM 7.9.5
- **State**: TanStack React Query 5.90.6
- **Testing**: Vitest + Testing Library + happy-dom
- **Styling**: Native CSS with Custom Properties (NO preprocessors)

### DevTools
- **Monorepo**: Turborepo 2.6.0
- **Package Manager**: pnpm 10.23.0
- **Linting**: Biome 2.3.2 (replaces ESLint + Prettier)
- **TypeScript**: 5.9.3 (strict mode)
- **Git Hooks**: Husky 9.1.7 + lint-staged 16.2.6
- **Commits**: commitlint (conventional commits)
- **Node**: 22.0.0 (see `.nvmrc`)

---

## 📝 Code Conventions

### File Naming
- **PascalCase**: Classes, components, use cases → `User.ts`, `LoginUseCase.ts`, `Button.tsx`
- **camelCase**: Utilities, functions → `jwtUtils.ts`, `passwordUtils.ts`
- **NO kebab-case** (except standard config files)
- **Extensions**: `.ts` for logic, `.tsx` for React components

### Code Naming
- **Entities**: `User`, `Team`, `RefreshToken`
- **Value Objects**: `Email`, `Role`, `EntityId`, `TeamName`, `FoundedYear`, `City`
- **Use Cases**: `{Action}{Entity}UseCase` → `CreateUserUseCase`, `ListTeamsUseCase`
- **Repositories**: `{ORM}{Entity}Repository` → `DrizzleUserRepository`, `ApiTeamRepository`
- **DTOs**: `{Purpose}DTO` → `LoginDTO`, `UserResponseDTO`, `CreateTeamDTO`
- **Interfaces**: Prefix `I` → `IUserRepository`, `ITeamRepository`

### Imports
- **ESM extensions**: Always use `.js` in imports → `import { User } from './User.js'`
- **Absolute imports**: Use `@/` alias in web app → `import { Email } from '@/domain/value-objects/Email.js'`
- **Barrel exports**: Use `index.ts` for public APIs

### Formatting (Biome)
- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Quotes**: Single (`'`)
- **Semicolons**: As-needed (only when necessary)
- **Organization**: Auto-sort imports

---

## 🏛️ Design Patterns

### 1. Domain-Driven Design (DDD)

#### Rich Entities (Backend)
Entities are NOT simple data objects. They have behavior and validation.

```typescript
// ✅ CORRECT - Rich entity
class User {
  private constructor(
    private id: string,
    private email: string,
    private passwordHash: string,
    private role: Role
  ) {}

  static create(data: CreateUserData): User {
    // Business validations
    if (!data.email.includes('@')) {
      throw new InvalidEmailError()
    }
    return new User(...)
  }

  hasRole(role: Role): boolean {
    return this.role === role
  }

  isSuperAdmin(): boolean {
    return this.role === Role.SUPER_ADMIN
  }
}

// ❌ WRONG - Anemic model
interface User {
  id: string
  email: string
  passwordHash: string
  role: string
}
```

#### Value Objects (Frontend)
Immutable objects with self-validation representing domain concepts.

**IMPORTANT**: Always use **named parameters** (objects) for constructors and methods.

```typescript
// ✅ CORRECT - Value Object with named parameters
class Email {
  private readonly value: string

  private constructor(props: { value: string }) {
    this.value = props.value
  }

  private static validate({ value }: { value: string }): ValidationError | null {
    if (!value || !value.includes('@')) {
      return ValidationError.forField({
        field: 'email',
        message: 'Invalid email format'
      })
    }
    return null
  }

  static create({ value }: { value: string }): Result<Email, ValidationError> {
    const error = Email.validate({ value })
    if (error) return Err(error)

    const trimmed = value.trim().toLowerCase()
    return Ok(new Email({ value: trimmed }))
  }

  getValue(): string {
    return this.value
  }

  getDomain(): string {
    return this.value.split('@')[1]
  }

  toJSON(): string {
    return this.value
  }
}

// ❌ WRONG - Primitive string
const email: string = "user@example.com"

// ❌ WRONG - Positional parameters
class Email {
  private constructor(value: string) {} // No named parameters
  static create(email: string): Result<Email, ValidationError> {} // No named parameters
}
```

### 2. Repository Pattern
Data access abstraction using interfaces (ports).

```typescript
// ✅ CORRECT - Define interface in domain/
export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
}

// Implementation in infrastructure/
export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Drizzle ORM logic
  }
}
```

### 3. Use Case Pattern
One use case = one user action. Orchestrates business logic.

**IMPORTANT**: Use Cases follow the same creation pattern as domain entities:
- **Private constructor** with **named parameters**
- **Static `create()` method** with **named parameters**
- Returns **Result<T, E>** pattern for explicit error handling

```typescript
// ✅ CORRECT - Use Case with create() pattern and named parameters
export class CreateTeamUseCase {
  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  private readonly teamRepository: ITeamRepository

  static create({ teamRepository }: { teamRepository: ITeamRepository }): CreateTeamUseCase {
    return new CreateTeamUseCase({ teamRepository })
  }

  async execute(dto: CreateTeamDTO): Promise<Result<TeamResponseDTO, ValidationError>> {
    // 1. Validate business rules
    const existingTeam = await this.teamRepository.findByName(dto.name)
    if (existingTeam) {
      return Err(new ValidationError(`Team "${dto.name}" already exists`, 'name'))
    }

    // 2. Create domain entity
    const [error, team] = Team.create({ ...dto, id: randomUUID() })
    if (error) return Err(error)

    // 3. Persist
    const savedTeam = await this.teamRepository.save(team)

    // 4. Return Result
    return Ok(savedTeam.toDTO())
  }
}

// ❌ WRONG - Public constructor without named parameters (old pattern)
export class CreateTeamUseCase {
  constructor(private teamRepository: ITeamRepository) {} // ❌ No named parameters
}

// ❌ WRONG - Logic in controller
app.post('/teams', async (req, res) => {
  const team = await db.insert(teams).values(req.body) // 😱
})
```

### 4. Manual Dependency Injection
We use a manual DI container (NO framework).

```typescript
// infrastructure/config/container.ts
export class Container {
  private static userRepository: IUserRepository | null = null

  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new DrizzleUserRepository()
    }
    return this.userRepository
  }

  static getCreateUserUseCase(): CreateUserUseCase {
    return CreateUserUseCase.create({
      userRepository: this.getUserRepository() // ✅ Injection with named parameters
    })
  }
}
```

### 5. Result Pattern (Frontend)
Functional error handling without exceptions.

```typescript
// ✅ CORRECT - Result pattern
const emailResult = Email.create(input)
if (emailResult.isFailure()) {
  return emailResult.error // ValidationError
}
const email = emailResult.value // Email

// ❌ WRONG - Throw/catch
try {
  const email = new Email(input)
} catch (e) {
  // ...
}
```

### 6. DTO Mapping Pattern
Entities are responsible for their own serialization/deserialization.

**NO separate mapper classes** unless transformation is complex (multiple DTOs, conditional logic, etc.).

```typescript
// ✅ CORRECT - Entity methods for DTO transformation
class User {
  // Factory from DTO
  static fromDTO(dto: UserResponseDTO): Result<User, ValidationError> {
    return User.create({
      id: dto.id,
      email: dto.email,
      role: dto.role,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    })
  }

  // Factory for lists
  static fromDTOList(dtos: UserResponseDTO[]): Result<User[], ValidationError> {
    const users: User[] = []
    for (const dto of dtos) {
      const [error, user] = User.fromDTO(dto)
      if (error) return Err(error)
      users.push(user)
    }
    return Ok(users)
  }

  // Serialize to DTO
  toDTO(): UserResponseDTO {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      role: this.role.getValue(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}

// Usage in repository
const [error, user] = User.fromDTO(apiResponse)
const dto = user.toDTO()

// ❌ WRONG - Separate mapper functions
function userToDomain(dto: UserResponseDTO): Result<User, ValidationError> { ... }
function userToDTO(user: User): UserResponseDTO { ... }

// ❌ WRONG - Mapper in application layer
// application/mappers/UserMapper.ts  <-- Don't do this
```

**When to use Mapper classes** (rare):
- Transformation involves multiple DTOs
- Complex conditional logic based on DTO shape
- Multiple external sources (API, Storage, etc.) with different formats

If needed, create mapper classes in `domain/mappers/` (NOT `application/mappers/`):

```typescript
// domain/mappers/ComplexEntityMapper.ts
export class ComplexEntityMapper {
  constructor(
    private readonly dto1: DTO1,
    private readonly dto2: DTO2
  ) {}

  toDomain(): Result<ComplexEntity, ValidationError> {
    // Complex transformation logic
  }
}
```

### 7. TypeScript Type Management Pattern
Separate type definitions from business logic to improve readability and leverage TypeScript's composition features.

**IMPORTANT**: Use `.types.ts` files for complex entities/value objects with multiple type definitions.

```typescript
// ✅ CORRECT - Separate .types.ts file with single source of truth
// Session.types.ts
import type { Token } from '../value-objects'
import type { User } from './User'

/**
 * Base Session properties with Token value objects
 * This is the single source of truth for Session shape
 */
export interface SessionProps {
  user: User
  accessToken: Token
  refreshToken: Token
  createdAt: Date
}

/**
 * Session constructor properties
 * Same as SessionProps - constructor receives validated Token value objects
 */
export type SessionConstructorProps = SessionProps

/**
 * Session creation data - uses raw string tokens for validation
 * Replaces Token value objects with strings that will be validated
 */
export type CreateSessionData = Omit<SessionProps, 'accessToken' | 'refreshToken'> & {
  accessToken: string
  refreshToken: string
}

/**
 * Session validation data
 * Same as CreateSessionData - validates before creating Tokens
 */
export type ValidateSessionData = CreateSessionData

/**
 * Session properties for fromValueObjects
 * Omits createdAt (will be set to new Date() internally)
 */
export type SessionValueObjectsProps = Omit<SessionProps, 'createdAt'>

/**
 * Update access token data
 */
export interface UpdateAccessTokenData {
  newAccessToken: string
}

/**
 * Update both tokens data
 */
export interface UpdateTokensData extends UpdateAccessTokenData {
  newRefreshToken: string
}

/**
 * Session serialized data - matches create() signature for symmetry
 * Same as CreateSessionData to preserve serialization/deserialization symmetry
 */
export type SessionData = CreateSessionData

// Session.ts
import type {
  CreateSessionData,
  SessionConstructorProps,
  SessionData,
  SessionValueObjectsProps,
  UpdateAccessTokenData,
  UpdateTokensData,
  ValidateSessionData,
} from './Session.types'

// Re-export public types
export type {
  CreateSessionData,
  SessionData,
  SessionValueObjectsProps,
  UpdateAccessTokenData,
  UpdateTokensData,
}

export class Session {
  private constructor(props: SessionConstructorProps) { ... }

  static create(data: CreateSessionData): Result<Session, ValidationError> { ... }

  updateAccessToken(data: UpdateAccessTokenData): Result<Session, ValidationError> { ... }

  toObject(): SessionData { ... }
}

// ❌ WRONG - Inline type definitions with duplication
export class Session {
  private constructor(
    user: User,
    accessToken: Token,
    refreshToken: Token,
    createdAt: Date
  ) {}

  static create(data: {
    user: User
    accessToken: string
    refreshToken: string
    createdAt: Date
  }): Result<Session, ValidationError> { ... }

  updateAccessToken(newAccessToken: string): Result<Session, ValidationError> { ... }

  toObject(): {
    user: User
    accessToken: string
    refreshToken: string
    createdAt: Date
  } { ... }
}

// ❌ WRONG - Duplicated type definitions
export interface SessionProps {
  user: User
  accessToken: Token
  refreshToken: Token
  createdAt: Date
}

export interface CreateSessionData {  // ❌ Duplicates properties
  user: User
  accessToken: string  // ❌ Redefines as string instead of deriving from SessionProps
  refreshToken: string
  createdAt: Date
}

export interface SessionData {  // ❌ More duplication
  user: User
  accessToken: string
  refreshToken: string
  createdAt: Date
}
```

**Type Management Principles**:
1. **Single Source of Truth**: Define one base interface/type with value objects
2. **Leverage TypeScript Composition**: Use `Omit`, `Pick`, `extends`, type aliases to derive other types
3. **Value Objects as Source**: Types should derive from value objects, not redefine primitives
4. **Avoid Duplication**: Never repeat property definitions across multiple types
5. **Semantic Aliases**: Use type aliases when types are conceptually the same but used in different contexts
6. **Separate Files**: Use `.types.ts` for complex entities with 3+ type definitions

**When to create `.types.ts` files**:
- Entity/Value Object has 3+ related type definitions
- Types are used across multiple files
- Inline definitions make the main file hard to read (>300 lines)

**When NOT to create `.types.ts` files**:
- Simple entities with 1-2 types
- Types are only used internally in one file
- Type definitions are trivial (single-line aliases)

### 8. Test-Driven Development (TDD) Pattern
**MANDATORY**: All code MUST be written following TDD principles.

#### TDD is NOT optional - it's the foundation of our development process

**The TDD Cycle (Red-Green-Refactor)**:

```typescript
// 1. RED - Write a failing test first
describe('Email', () => {
  it('should create valid email', () => {
    const [error, email] = Email.create({ value: 'user@example.com' })

    expect(error).toBeNull()
    expect(email).toBeDefined()
    expect(email!.getValue()).toBe('user@example.com')
  })
})

// 2. GREEN - Write minimal code to make it pass
export class Email {
  private readonly value: string

  private constructor(props: { value: string }) {
    this.value = props.value
  }

  static create({ value }: { value: string }): Result<Email, ValidationError> {
    return Ok(new Email({ value }))  // Minimal implementation
  }

  getValue(): string {
    return this.value
  }
}

// 3. REFACTOR - Add validation, improve code
static create({ value }: { value: string }): Result<Email, ValidationError> {
  // Add validation after test passes
  if (!value || !value.includes('@')) {
    return Err(new ValidationError('Invalid email'))
  }
  const trimmed = value.trim().toLowerCase()
  return Ok(new Email({ value: trimmed }))
}
```

#### TDD Workflow - ALWAYS follow this order:

**For NEW code (features, entities, value objects)**:
1. **Write test FIRST** - describe expected behavior
2. **Run test** - verify it fails (RED)
3. **Write minimal code** - make test pass (GREEN)
4. **Refactor** - improve code while keeping tests green
5. **Repeat** for each behavior/method

**For REFACTORING existing code**:
1. **Ensure tests exist** - if not, write them FIRST
2. **All tests green** - verify current behavior works
3. **Refactor code** - change implementation
4. **Tests still green** - verify behavior preserved
5. **Add new tests** - for any new functionality

**For BUG FIXES**:
1. **Write failing test** - reproduce the bug
2. **Fix the code** - make test pass
3. **Verify fix** - all tests green

#### TDD Benefits in our codebase:

✅ **Confidence**: Refactoring Session/Team/User entities is safe because tests verify behavior
✅ **Documentation**: Tests show how to use entities and value objects
✅ **Design**: Writing tests first forces better API design (named parameters!)
✅ **Regression**: Catch bugs before they reach production
✅ **Speed**: Less debugging, faster iterations

#### What to test:

**Entities & Value Objects**:
- ✅ `create()` with valid data
- ✅ `create()` with invalid data (all validation cases)
- ✅ All public methods
- ✅ Edge cases (null, undefined, empty strings, boundaries)
- ✅ Immutability (methods return new instances)

**Use Cases**:
- ✅ Happy path
- ✅ Error cases (validation failures, not found, unauthorized)
- ✅ Edge cases

**Repositories**:
- ✅ CRUD operations
- ✅ Error handling (DB failures, not found)

**DO NOT test**:
- ❌ Private methods (test through public API)
- ❌ Implementation details (test behavior, not structure)
- ❌ Third-party libraries

#### Test Structure:

```typescript
describe('EntityName', () => {
  describe('create()', () => {
    it('should create entity with valid data', () => {
      // Arrange
      const data = { /* valid data */ }

      // Act
      const [error, entity] = Entity.create(data)

      // Assert
      expect(error).toBeNull()
      expect(entity).toBeDefined()
    })

    it('should fail with invalid data', () => {
      // Arrange
      const data = { /* invalid data */ }

      // Act
      const [error, entity] = Entity.create(data)

      // Assert
      expect(error).toBeDefined()
      expect(entity).toBeNull()
    })
  })

  describe('methodName()', () => {
    // Test each public method
  })
})
```

#### TDD Enforcement:

**BEFORE writing ANY production code, ask yourself**:
- ❓ Do I have a failing test for this?
- ❓ Am I writing the MINIMAL code to pass the test?
- ❓ Are all existing tests still green?

**Code reviews will reject**:
- ❌ Production code without tests
- ❌ Tests written after production code (except for bug fixes to existing code)
- ❌ Low test coverage

**Remember**: If you write code without tests first, you're doing it wrong. Delete it and start over with TDD.

---

## 🚨 Error Management System

### Overview
All errors are **centralized** in `@team-pulse/shared/errors` for:
- ✅ Type safety across API and Web
- ✅ Framework-agnostic design
- ✅ Consistent error handling
- ✅ Automatic sanitization of internal errors

📚 **Full documentation**: `docs/errors/README.md`

### Error Types & HTTP Status Codes

```typescript
import {
  ValidationError,        // 400 - Bad Request
  AuthenticationError,    // 401 - Unauthorized
  AuthorizationError,     // 403 - Forbidden
  NotFoundError,          // 404 - Not Found
  ConflictError,          // 409 - Conflict
  BusinessRuleError,      // 422 - Unprocessable Entity
  RepositoryError,        // 500 - Internal Server Error
  ExternalServiceError,   // 502/503 - Service Error
  InternalError,          // 500 - Internal Server Error
} from '@team-pulse/shared/errors'
```

### Usage Patterns

#### ✅ In Value Objects (use Result<T, E>)
```typescript
import { ValidationError } from '@team-pulse/shared/errors'
import { Ok, Err, type Result } from '@team-pulse/shared/result'

static create({ value }: { value: string }): Result<Email, ValidationError> {
  if (!value) {
    return Err(ValidationError.forField({
      field: 'email',
      message: 'Email is required'
    }))
  }

  if (!EMAIL_REGEX.test(value)) {
    return Err(ValidationError.invalidValue({
      field: 'email',
      value,
      message: 'Invalid email format'
    }))
  }

  return Ok(new Email(value))
}
```

#### ✅ In Use Cases (use Result<T, E>)
```typescript
async execute(dto: CreateUserDTO): Promise<Result<UserDTO, ValidationError | ConflictError>> {
  // 1. Validate input
  const emailResult = Email.create({ value: dto.email })
  if (!emailResult.ok) return Err(emailResult.error)

  // 2. Check duplicates
  const exists = await this.repository.existsByEmail(dto.email)
  if (exists) {
    return Err(ConflictError.duplicate({
      resource: 'User',
      identifier: dto.email
    }))
  }

  // ... persist and return
}
```

#### ✅ In Repositories (throw for exceptional errors)
```typescript
import { RepositoryError } from '@team-pulse/shared/errors'

async save(user: User): Promise<void> {
  try {
    await this.db.insert(users).values(userData)
  } catch (error) {
    throw RepositoryError.forOperation({
      operation: 'save',
      message: 'Failed to save user',
      cause: error as Error
    })
  }
}
```

### Factory Methods

All errors use **factory methods** (never `new` directly):

```typescript
// ✅ CORRECT
ValidationError.forField({ field: 'email', message: 'Required' })
ValidationError.invalidValue({ field: 'email', value, message: 'Invalid' })
ValidationError.fromZodError({ error: zodError })

NotFoundError.forResource({ resource: 'User', identifier: id })

ConflictError.duplicate({ resource: 'User', identifier: email })

RepositoryError.forOperation({ operation: 'save', message: '...', cause: err })

AuthenticationError.invalidCredentials()
AuthenticationError.invalidToken({ reason: 'expired' })

// ❌ WRONG
new ValidationError({ message: '...' })
```

### Error Handler

The `ErrorHandler` is framework-agnostic and handles normalization + sanitization:

```typescript
import { ErrorHandler, ConsoleLogger } from '@team-pulse/shared/errors/handler'

const errorHandler = new ErrorHandler({
  logger: new ConsoleLogger(),
  includeStackTrace: process.env.NODE_ENV === 'development'
})

// Automatically:
// 1. Normalizes any error to ApplicationError
// 2. Logs with appropriate severity
// 3. Sanitizes internal errors (500s) - hides sensitive details
// 4. Returns safe HTTP response
```

### Key Rules

1. **All errors in shared package** - NEVER create errors in domain/
2. **Use factory methods** - NEVER use `new ValidationError()` directly
3. **Result<T, E> for expected errors** - In Value Objects and Use Cases
4. **throw for exceptional errors** - In Repositories and Infrastructure
5. **Trust the ErrorHandler** - It normalizes and sanitizes automatically

---

## 🧪 Testing

### Testing Strategy

#### Backend: Testcontainers (Total Isolation)
- **Each test suite** gets its **own PostgreSQL database** in Docker
- **Random port** → 100% parallel tests without conflicts
- **Automatic setup/teardown**: Container created and destroyed per suite

```typescript
// ✅ Backend test pattern
describe('User Use Cases', () => {
  let container: StartedPostgreSqlContainer
  let db: DrizzleDB
  let userRepository: DrizzleUserRepository
  let useCase: CreateUserUseCase

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start()
    db = drizzle(container.getConnectionString())
    userRepository = new DrizzleUserRepository(db)
    useCase = new CreateUserUseCase(userRepository)
  })

  afterAll(async () => {
    await container.stop()
  })

  it('should create user', async () => {
    const user = await useCase.execute({ email: '...', password: '...' })
    expect(user.email).toBe('...')
  })
})
```

#### Frontend: Testing Library
- **happy-dom** as environment (faster than jsdom)
- **Testing Library** for component tests
- **DO NOT test implementation details**, test user behavior

### Testing Commands
```bash
make test           # All tests
make test-api       # Backend only
make test-web       # Frontend only
make test-watch     # Watch mode
make test-coverage  # With coverage
```

---

## 🚀 Build & Deployment

### Local Development

#### Make Commands (USE THESE)
```bash
make setup          # Initial setup (install + db setup + seed)
make start          # Start all services (db + api + web)
make dev            # Alias for start
make stop           # Stop services

make db-up          # Database only
make db-push        # Push schema to DB
make db-seed        # Seed SUPER_ADMIN (admin@example.com / Admin123!)
make db-studio      # Drizzle Studio (GUI)

make test           # Tests
make lint           # Biome lint
make format         # Biome format
make type-check     # TypeScript check
```

#### Docker Compose
```bash
docker compose up -d    # Start PostgreSQL 16
docker compose down     # Stop PostgreSQL
```

### Production (Vercel)

#### Configuration (`vercel.json`)
- **Build**: `turbo build`
- **Frontend**: Static files from `apps/web/dist/`
- **Backend**: Serverless function at `/api/index.ts` (wraps Fastify)
- **Timeout**: 10s max
- **Memory**: 1024MB

#### Rewrites
- `/api/*` → `/api/index.ts` (serverless function)
- `/*` → `/index.html` (SPA)

#### Environment Variables (Vercel Dashboard)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=production
```

#### CI/CD
1. **Push to `main`** → GitHub Actions CI
2. **CI passes** → Automatic deploy to Vercel
3. **Vercel** → Build + Deploy

---

## 🔐 Authentication & Authorization

### Strategy: JWT + Refresh Tokens

#### Login Flow
1. POST `/api/auth/login` → `{ email, password }`
2. Validate credentials
3. Generate `accessToken` (15min) + `refreshToken` (7 days)
4. Save `refreshToken` in DB
5. Return both tokens

#### Refresh Flow
1. POST `/api/auth/refresh` → `{ refreshToken }`
2. Validate refresh token in DB
3. Generate new `accessToken`
4. Return new token

#### Roles (RBAC)
```typescript
enum Role {
  SUPER_ADMIN = 3,  // All operations
  ADMIN = 2,        // User and team management
  USER = 1          // Read only
}
```

**Hierarchy**: SUPER_ADMIN > ADMIN > USER

#### Route Protection
- **Backend**: Middleware `authenticate` + `authorize([Role.ADMIN])`
- **Frontend**: Hook `useAuth()` + `AuthGuard` component

---

## 📦 Domain Model

### Backend Entities

#### User
```typescript
{
  id: string (UUID)
  email: string (unique)
  passwordHash: string (bcrypt)
  role: Role (SUPER_ADMIN | ADMIN | USER)
  createdAt: Date
  updatedAt: Date
}
```

**Factory Methods**:
- `create(data: CreateUserData): Result<User, ValidationError>` - Creates User from primitives with validation (timestamps optional)
- `fromValueObjects(props: UserProps): User` - Creates User from validated Value Objects (no re-validation)
- `fromDTO(dto: UserResponseDTO): Result<User, ValidationError>` - Creates User from API DTO
- `fromDTOList(dtos: UserResponseDTO[]): Result<User[], ValidationError>` - Creates User array from DTO array

**Business Methods**: `update()`, `hasRole()`, `hasRoleLevel()`, `isSuperAdmin()`, `isAdmin()`

**Serialization**: `toObject()`, `toDTO()`

**IMPORTANT**: Backend User follows the SAME pattern as Frontend User:
- Uses separate `.types.ts` file for type definitions
- NO `fromPersistence()` method (use `create()` with timestamps)
- `update()` calls `create()` internally (no duplicate validation)
- Self-contained DTO mapping (no separate mapper classes)

#### Team
```typescript
{
  id: string (UUID)
  name: string
  city: string
  foundedYear: number (optional, 1800-present)
  createdAt: Date
  updatedAt: Date
}
```

**Methods**: `create()`, `update()`, `toObject()`

#### RefreshToken
```typescript
{
  id: string (UUID)
  token: string (unique)
  userId: string (FK → User)
  expiresAt: Date
  createdAt: Date
}
```

**Methods**: `create()`, `isExpired()`, `isValid()`, `toObject()`

### Frontend Value Objects

#### Email
- Validation: format, length (max 255), trimming, lowercase
- Methods: `getValue()`, `getDomain()`, `getLocalPart()`, `equals()`

#### Role
- Enum: SUPER_ADMIN (3), ADMIN (2), USER (1)
- Methods: `hasLevelOf()`, `canPerform()`, `isSuperAdmin()`, `isAdmin()`

#### EntityId
- Validation: UUID v4

#### TeamName
- Validation: length, trimming

#### FoundedYear
- Validation: range 1800-present

#### City
- Validation: city name

---

## 🎨 Development Guidelines

### When Creating New Features

#### 1. Define the Domain (Domain Layer)
- What entity or value object do you need?
- What business validations does it have?
- What behavior does it need?

#### 2. Define the Use Case (Application Layer)
- What user action does it solve?
- What repositories does it need?
- What validations does it orchestrate?

#### 3. Implement the Adapters (Infrastructure Layer)
- Repository with Drizzle/API
- HTTP routes/controllers
- DTO ↔ Domain mappers

#### 4. Create the UI (Presentation Layer - frontend only)
- React components
- Custom hooks
- Pages

### When Refactoring
- **DO NOT break layers**: Domain never imports from Infrastructure
- **Keep tests passing**: Run tests after each change
- **Atomic commits**: One commit = one logical change

### Error Handling
- **Backend**: Throw domain errors → Catch in controller → Return HTTP status
- **Frontend**: Result pattern → Show errors in UI

### Performance
- **Backend**: DB indexes, efficient queries with Drizzle
- **Frontend**: React.memo, useMemo, useCallback for heavy components

---

## 🚨 Golden Rules

### ✅ DO
1. **ALWAYS write tests FIRST (TDD)** - never write production code without a failing test
2. Always respect hexagonal architecture
3. Use value objects in frontend for validation
4. Rich entities with business logic (backend)
5. One use case = one responsibility
6. **Entity methods for DTO mapping** (`fromDTO()`, `toDTO()`, `fromDTOList()`)
7. Tests with Testcontainers for backend
8. Conventional commits
9. TypeScript strict mode
10. Imports with `.js` extension
11. Use Makefile for common commands
12. Pre-commit hooks (lint, type-check, tests)
13. **Named parameters (objects) for functions** - scalable and provides context: `create({ value })` instead of `create(value)`
14. **Private constructors + separate `validate()` method** - centralized validation for entities and value objects
15. **`create()` signature matches `toJSON()` output** - preserve serialization/deserialization symmetry
16. **Separate type definitions in `.types.ts` files** - single source of truth with TypeScript composition (`Omit`, `Pick`, `extends`)

### ❌ DON'T
1. **Write production code without tests first** - this is the #1 rule, break it and start over
2. Business logic in controllers/components
3. Direct DB access from use cases (use repositories)
4. Circular imports
5. Anemic classes (only getters/setters)
6. **Separate mapper functions or classes** (unless transformation is complex)
7. **Mappers in application layer** (`application/mappers/` - forbidden)
8. Frontend-only validations (validate on both sides)
9. console.log in production (use logger)
10. Plain text passwords (always hash with bcrypt)
11. Secrets in code (use .env)
12. Tests with shared database (use Testcontainers)
13. Commits without conventional type (feat:, fix:, etc.)
14. **Duplicate type definitions** - use TypeScript composition to derive types from a single source of truth
15. **Skip tests for "simple" code** - if it's code, it needs tests

---

## 🔧 Troubleshooting

### Error: "Cannot find module"
- ✅ Check `.js` extension in imports
- ✅ Check path is correct
- ✅ Run `pnpm install`

### Tests fail with DB
- ✅ Check Docker running: `docker ps`
- ✅ Clean containers: `docker compose down -v`
- ✅ Restart: `make db-down && make db-up`

### Build fails
- ✅ Clean: `rm -rf dist/` and `turbo clean`
- ✅ Reinstall: `rm -rf node_modules/ && pnpm install`
- ✅ Type-check: `make type-check`

### Vercel deploy fails
- ✅ Check environment variables in dashboard
- ✅ Check `vercel.json` configuration
- ✅ View logs: `vercel logs`

---

## 📚 Resources

### Key Documentation
- **Fastify**: https://fastify.dev/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Drizzle ORM**: https://orm.drizzle.team/
- **Vitest**: https://vitest.dev/
- **Turborepo**: https://turbo.build/
- **Biome**: https://biomejs.dev/

### Architecture
- **Hexagonal Architecture**: https://alistair.cockburn.us/hexagonal-architecture/
- **DDD**: "Domain-Driven Design" by Eric Evans
- **Clean Architecture**: "Clean Architecture" by Robert C. Martin

---

## 🎯 Quick Commands

```bash
# Development
make setup          # First time
make start          # Start everything
make test           # Tests
make lint           # Linter
make format         # Format
make type-check     # TypeScript

# Database
make db-push        # Apply schema
make db-seed        # Seed admin
make db-studio      # GUI

# Cleanup
make clean          # Clean builds
make db-down        # Stop DB
```

---

**Last updated**: 2025-11-05
**Node version**: 22.0.0
**Package manager**: pnpm 10.23.0
