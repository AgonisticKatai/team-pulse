# TeamPulse - Architecture Agreements & Patterns

**Based on exhaustive analysis of `/apps/api/src/`**

This document captures ALL architectural patterns used consistently in the API. These patterns are **MANDATORY** for new features.

---

## Table of Contents

1. [Domain Layer Patterns](#1-domain-layer-patterns)
2. [Application Layer Patterns](#2-application-layer-patterns)
3. [Infrastructure Layer Patterns](#3-infrastructure-layer-patterns)
4. [Testing Patterns](#4-testing-patterns)
5. [Type System Patterns](#5-type-system-patterns)
6. [Hexagonal Architecture](#6-hexagonal-architecture)
   - [6.1 Ports & Adapters Pattern](#61-ports--adapters-pattern)
   - [6.2 Path Aliases - Architecture-Aligned Imports](#62-path-aliases---architecture-aligned-imports)
7. [Mandatory Agreements Summary](#7-mandatory-agreements-summary)

---

# 1. DOMAIN LAYER PATTERNS

## 1.1 Domain Models - Private Constructor Pattern

**Pattern Name:** Private Constructor + Static Factory Methods

**Why:**
- Prevents invalid construction
- Centralized validation
- Separation of concerns: `create()` validates primitives, `fromValueObjects()` trusts validated VOs
- Returns `Result<T, E>`: Explicit error handling without exceptions

**Real Code Example:**
```typescript
// User.ts
export class User {
  public readonly id: EntityId
  public readonly email: Email
  private readonly passwordHash: string
  public readonly role: Role
  public readonly createdAt: Date
  public readonly updatedAt: Date

  private constructor({ id, email, passwordHash, role, createdAt, updatedAt }: UserConstructorProps) {
    this.id = id
    this.email = email
    this.passwordHash = passwordHash
    this.role = role
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data: CreateUserData): Result<User, ValidationError> {
    const idResult = EntityId.create({ value: data.id })
    if (!idResult.ok) return Err(idResult.error)

    const emailResult = Email.create({ value: data.email })
    if (!emailResult.ok) return Err(emailResult.error)

    return Ok(new User({
      createdAt: data.createdAt ?? new Date(),
      email: emailResult.value,
      id: idResult.value,
      passwordHash: passwordResult.value,
      role: roleResult.value,
      updatedAt: data.updatedAt ?? new Date(),
    }))
  }

  static fromValueObjects(props: UserProps): User {
    return new User(props)
  }
}
```

**❌ DO NOT:**
```typescript
// Public constructor without validation
export class User {
  constructor(public id: string, public email: string, public role: string) {}
}

// Throwing in constructor
export class User {
  constructor(id: string) {
    if (!id) throw new Error("Invalid id")
  }
}
```

**Applied in:**
- `domain/models/User.ts`
- `domain/models/Team.ts`
- `domain/models/RefreshToken.ts`

---

## 1.2 Domain Models - Dual Factory Pattern

**Pattern Name:** Two Factory Methods with Different Purposes

**Why:**
- `create()`: Used by infrastructure (DB) and use cases with primitive data
- `fromValueObjects()`: Efficient when you already have validated Value Objects
- Avoids double validation
- Intentional clarity in code

**Real Code Example:**
```typescript
// User.ts - Method 1: create() for primitives
static create(data: CreateUserData): Result<User, ValidationError> {
  // Validates PRIMITIVES
  const idResult = EntityId.create({ value: data.id })
  if (!idResult.ok) return Err(idResult.error)

  const emailResult = Email.create({ value: data.email })
  if (!emailResult.ok) return Err(emailResult.error)

  return Ok(new User({
    id: idResult.value,
    email: emailResult.value,
    ...
  }))
}

// User.ts - Method 2: fromValueObjects() for validated VOs
static fromValueObjects(props: UserProps): User {
  // NO VALIDATION - Value Objects are already validated
  return new User(props)
}
```

**❌ DO NOT:**
```typescript
// Ambiguous single factory method
static fromData(data: any): Result<User, ValidationError> {
  if (data.id instanceof EntityId) {
    // ...
  } else {
    // ...
  }
  // Unclear if data has Value Objects or primitives
}
```

**Applied in:**
- `domain/models/User.ts`
- `domain/models/Team.ts`
- `domain/models/RefreshToken.ts`

---

## 1.3 Domain Models - Update Via Recreation

**Pattern Name:** update() Calls create() Internally

**Why:**
- Reuses validations: No duplicate logic in `update()`
- Guarantees invariants: Same contracts as `create()`
- Immutability: Returns new instance
- Consistent error handling

**Real Code Example:**
```typescript
// User.ts
update(data: UpdateUserData): Result<User, ValidationError> {
  return User.create({
    createdAt: this.createdAt, // Preserves original
    email: data.email ?? this.email.getValue(), // Merge new with old
    id: this.id.getValue(),
    passwordHash: data.passwordHash ?? this.passwordHash,
    role: data.role ?? this.role.getValue(),
    updatedAt: new Date(), // New timestamp
  })
}
```

**❌ DO NOT:**
```typescript
// Separate validation in update()
update(data: UpdateUserData): User {
  if (data.email && data.email.length > 255) {
    throw new Error("Email too long")
  }
  this.email = data.email ?? this.email // Mutates state
  return this
}
```

**Applied in:**
- `domain/models/User.ts` (lines 136-145)
- `domain/models/Team.ts` (lines 136-145)

---

## 1.4 Domain Models - Rich Domain Methods

**Pattern Name:** Pure Domain Methods

**Why:**
- Encapsulates business rules
- No infrastructure dependencies
- Easy to test
- Self-documenting: method explains intention

**Real Code Example:**
```typescript
// User.ts - Pure business logic methods
hasRole(role: string): boolean {
  const roleResult = Role.create({ value: role })
  if (!roleResult.ok) return false
  return this.role.equals({ other: roleResult.value })
}

hasRoleLevel(minimumRole: string): boolean {
  const roleResult = Role.create({ value: minimumRole })
  if (!roleResult.ok) return false
  return this.role.hasLevelOf({ other: roleResult.value })
}

isSuperAdmin(): boolean {
  return this.role.getValue() === UserRole.SuperAdmin
}

// RefreshToken.ts - Business logic
isExpired(): boolean {
  return new Date() > this.expiresAt
}

isValid(): boolean {
  return !this.isExpired()
}
```

**❌ DO NOT:**
```typescript
// Business logic scattered in use case
async execute(dto) {
  const user = await repository.findById({ id: dto.userId })
  if (!user) return Err(...)

  // Role logic loose in use case
  if (user.role.getValue() === 'ADMIN' || user.role.getValue() === 'SUPER_ADMIN') {
    // ...
  }
}
```

**Applied in:**
- `domain/models/User.ts` (lines 150-183)
- `domain/models/RefreshToken.ts` (lines 110-119)

---

## 1.5 Value Objects - Self-Validating Pattern

**Pattern Name:** Value Object with Private Constructor

**Why:**
- Immutability: `private readonly value`
- Self-validation: Invalid VO cannot exist
- Reusability: `protected static` methods for composition
- Validation composition: Each step validates
- Utility methods: `getValue()`, `equals()`, `toString()`

**Real Code Example:**
```typescript
// Email.ts
export class Email {
  protected static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  protected static readonly MAX_LENGTH = 255

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  // PROTECTED static validations (reusable)
  protected static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address is required' }))
    }
    return Ok(value.trim().toLowerCase())
  }

  protected static validateFormat({ value }: { value: string }): Result<string, ValidationError> {
    if (!Email.EMAIL_REGEX.test(value)) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address format is invalid' }))
    }
    return Ok(value)
  }

  protected static validateLength({ value }: { value: string }): Result<string, ValidationError> {
    if (value.length > Email.MAX_LENGTH) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address must not exceed 255 characters' }))
    }
    return Ok(value)
  }

  // Factory method - composition of validations
  static create({ value }: { value: string }): Result<Email, ValidationError> {
    const notEmptyResult = Email.validateNotEmpty({ value })
    if (!notEmptyResult.ok) return Err(notEmptyResult.error)

    const formatResult = Email.validateFormat({ value: notEmptyResult.value })
    if (!formatResult.ok) return Err(formatResult.error)

    const lengthResult = Email.validateLength({ value: formatResult.value })
    if (!lengthResult.ok) return Err(lengthResult.error)

    return Ok(new Email({ value: lengthResult.value }))
  }

  getValue(): string {
    return this.value
  }

  equals({ other }: { other: Email }): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  toJSON(): string {
    return this.value
  }
}
```

**❌ DO NOT:**
```typescript
// Public constructor without validation
export class Email {
  constructor(public value: string) {}
}

// Validation in wrong place (confusing)
export class Email {
  constructor(private value: string) {
    if (!this.validate()) throw new Error("Invalid")
  }
  private validate() { ... }
}
```

**Applied in:**
- `domain/value-objects/Email.ts`
- `domain/value-objects/EntityId.ts`
- `domain/value-objects/TeamName.ts`
- `domain/value-objects/Role.ts`

---

## 1.6 Domain Errors - Error Hierarchy

**Pattern Name:** Centralized Error System in Shared Package

**Why:**
- Centralized in `@team-pulse/shared/errors`: Reusable across API and Web
- Single hierarchy: All errors extend `ApplicationError`
- Factory methods: Consistency and type safety
- Rich metadata: `code`, `category`, `severity`, `metadata`
- Framework-agnostic: Works with any HTTP framework or frontend

📚 **Full documentation**: `docs/errors/README.md`

**Real Code Example:**
```typescript
// All errors imported from shared
import { ValidationError, NotFoundError, RepositoryError } from '@team-pulse/shared/errors'

// ValidationError - Use in Value Objects (Result<T, E>)
export class Email {
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
}

// NotFoundError - Use in Use Cases or Repositories
const user = await repository.findById(id)
if (!user) {
  throw NotFoundError.forResource({
    resource: 'User',
    identifier: id
  })
}

// RepositoryError - Use in Repository implementations
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

**❌ DO NOT:**
```typescript
// ❌ Creating errors with new directly
const error = new ValidationError({ message: '...' })

// ❌ Generic Error
throw new Error("User not found")

// ❌ Creating errors in domain/ (use shared instead)
// domain/errors/ValidationError.ts ❌

// ❌ Using throw in Value Objects (use Result<T,E> instead)
static create(value: string): Email {
  if (!value) throw new Error('Invalid') // ❌
}
error.field = "email" // Mutable, can be forgotten
```

**Applied in:**
- `domain/errors/DomainError.ts`
- `domain/errors/ValidationError.ts`
- `domain/errors/RepositoryError.ts`
- `domain/errors/DuplicatedError.ts`

---

## 1.7 Repository Interfaces - Named Parameters

**Pattern Name:** I-Prefix Interfaces with Named Parameters

**Why:**
- `I` prefix: Clear interface convention
- Named parameters: `{ id }` instead of `id` (self-documenting)
- Consistent return type: Always `Promise<Result<T, RepositoryError>>`
- Pure methods: `findById`, `save`, `delete`
- No exceptions: Uses `Result` for errors

**Real Code Example:**
```typescript
// IUserRepository.ts
export interface IUserRepository {
  findById({ id }: { id: string }): Promise<Result<User | null, RepositoryError>>

  findByEmail({ email }: { email: string }): Promise<Result<User | null, RepositoryError>>

  findAll(): Promise<Result<User[], RepositoryError>>

  save({ user }: { user: User }): Promise<Result<User, RepositoryError>>

  delete({ id }: { id: string }): Promise<Result<boolean, RepositoryError>>

  existsByEmail({ email }: { email: string }): Promise<Result<boolean, RepositoryError>>
}
```

**❌ DO NOT:**
```typescript
// Positional parameters
interface IUserRepository {
  findById(id: string): Promise<User | null>
}

// Inconsistent return types
interface IUserRepository {
  findById(id): Promise<User | null> // Might be null
  save(user): User // Never null
  delete(id): Promise<void> // What if it fails?
}
```

**Applied in:**
- `domain/repositories/IUserRepository.ts`
- `domain/repositories/ITeamRepository.ts`
- `domain/repositories/IRefreshTokenRepository.ts`
- `domain/services/IPasswordHasher.ts`

---

# 2. APPLICATION LAYER PATTERNS

## 2.1 Use Cases - Application Service Pattern

**Pattern Name:** Use Case / Application Service

**Why:**
- Naming: `{Action}{Entity}UseCase` is self-explanatory
- Private constructor: Guarantees correct DI
- Factory method: Consistency with rest of codebase
- execute() method: Known contract
- Return type: Always `Result<DTO, Error>`
- Orchestration: Coordinates repositories, services, factories
- Not HTTP-aware: Uses DTOs agnostic to transport

**Real Code Example:**
```typescript
// CreateUserUseCase.ts
export class CreateUserUseCase {
  private readonly userRepository: IUserRepository
  private readonly passwordHasher: IPasswordHasher

  private constructor({ userRepository, passwordHasher }: {
    userRepository: IUserRepository
    passwordHasher: IPasswordHasher
  }) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
  }

  static create({ userRepository, passwordHasher }: {
    userRepository: IUserRepository
    passwordHasher: IPasswordHasher
  }): CreateUserUseCase {
    return new CreateUserUseCase({ userRepository, passwordHasher })
  }

  async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, DuplicatedError | RepositoryError | ValidationError>> {
    // 1. Verify business rule
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })
    if (!findUserResult.ok) return Err(findUserResult.error)
    if (findUserResult.value) {
      return Err(DuplicatedError.create({ entityName: 'User', identifier: dto.email }))
    }

    // 2. Hash password
    const hashResult = await this.passwordHasher.hash({ password: dto.password })
    if (!hashResult.ok) return Err(hashResult.error)

    // 3. Create domain entity
    const createUserResult = User.create({
      email: dto.email,
      id: randomUUID(),
      passwordHash: hashResult.value,
      role: dto.role
    })
    if (!createUserResult.ok) return Err(createUserResult.error)

    // 4. Persist
    const saveUserResult = await this.userRepository.save({ user: createUserResult.value })
    if (!saveUserResult.ok) return Err(saveUserResult.error)

    // 5. Return DTO
    return Ok(saveUserResult.value.toDTO())
  }
}
```

**❌ DO NOT:**
```typescript
// Ambiguous name
export class UserService {
  // What does it do exactly?
}

// Public constructor
export class CreateUserUseCase {
  constructor(userRepository) { // Manual DI in client?
    this.userRepository = userRepository
  }
}

// No Result return
async execute(dto) {
  try {
    // ...
    return userDTO
  } catch (e) {
    throw new Error("Failed") // Exceptions
  }
}
```

**Applied in:**
- `application/use-cases/CreateUserUseCase.ts`
- `application/use-cases/LoginUseCase.ts`
- `application/use-cases/CreateTeamUseCase.ts`
- All files in `application/use-cases/`

---

## 2.2 Use Cases - Railway-Oriented Programming

**Pattern Name:** Explicit Result Checking

**Why:**
- Explicit: Every operation is visible
- Detectable: Easy to see what can fail
- No exceptions: Safe control flow
- Composable: Each result is independent
- Type-safe: TypeScript guarantees error handling

**Real Code Example:**
```typescript
async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, DuplicatedError | RepositoryError | ValidationError>> {
  // Step 1: Check duplicate
  const findUserResult = await this.userRepository.findByEmail({ email: dto.email })

  if (!findUserResult.ok) {
    return Err(findUserResult.error) // Infrastructure error
  }

  if (findUserResult.value) {
    return Err(DuplicatedError.create({ entityName: 'User', identifier: dto.email })) // Business rule error
  }

  // Step 2: Hash
  const hashResult = await this.passwordHasher.hash({ password: dto.password })

  if (!hashResult.ok) {
    return Err(hashResult.error)
  }

  // Step 3: Create domain entity
  const createUserResult = User.create({
    email: dto.email,
    id: randomUUID(),
    passwordHash: hashResult.value,
    role: dto.role
  })

  if (!createUserResult.ok) {
    return Err(createUserResult.error)
  }

  // Step 4: Save
  const saveUserResult = await this.userRepository.save({ user: createUserResult.value })

  if (!saveUserResult.ok) {
    return Err(saveUserResult.error)
  }

  // Success
  return Ok(saveUserResult.value.toDTO())
}
```

**❌ DO NOT:**
```typescript
// Ignoring errors
async execute(dto) {
  const user = (await this.userRepository.findByEmail({ email: dto.email })).value
  // What if findByEmail failed?
  const hash = (await this.passwordHasher.hash({ password: dto.password })).value
  // What if hash failed?
}

// Exceptions
async execute(dto) {
  try {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })
    if (findUserResult.ok && findUserResult.value) {
      throw DuplicatedError.create(...)
    }
  } catch (e) {
    return Err(e)
  }
}
```

**Applied in:**
- `application/use-cases/CreateUserUseCase.ts` (lines 41-71)
- `application/use-cases/LoginUseCase.ts` (lines 71-124)
- `application/use-cases/CreateTeamUseCase.ts` (lines 40-64)

---

# 3. INFRASTRUCTURE LAYER PATTERNS

## 3.1 Repository Implementations - ORM Adapter

**Pattern Name:** Drizzle Repository Implementation

**Why:**
- Naming: `Drizzle` + `UserRepository` = clear technology
- Implements interface: Adheres to domain contract
- Private mapping: BD → Domain conversion
- Error handling: Catches exceptions, returns `Result`
- No infrastructure leaks: Domain models don't know Drizzle
- Upsert pattern: `onConflictDoUpdate` for save

**Real Code Example:**
```typescript
// DrizzleUserRepository.ts
export class DrizzleUserRepository implements IUserRepository {
  private readonly db: Database

  private constructor({ db }: { db: Database }) {
    this.db = db
  }

  static create({ db }: { db: Database }): DrizzleUserRepository {
    return new DrizzleUserRepository({ db })
  }

  async findById({ id }: { id: string }): Promise<Result<User | null, RepositoryError>> {
    try {
      const [user] = await this.db.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1)

      if (!user) return Ok(null)

      const domainResult = this.mapToDomain({ user })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map user to domain',
            operation: 'findById',
          }),
        )
      }

      return Ok(domainResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find user by id',
          operation: 'findById',
        }),
      )
    }
  }

  async save({ user }: { user: User }): Promise<Result<User, RepositoryError>> {
    try {
      const obj = user.toObject()

      const row = {
        createdAt: obj.createdAt,
        email: obj.email,
        id: obj.id,
        passwordHash: user.getPasswordHash(),
        role: obj.role,
        updatedAt: obj.updatedAt,
      }

      await this.db
        .insert(usersSchema)
        .values(row)
        .onConflictDoUpdate({
          set: {
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role,
            updatedAt: row.updatedAt,
          },
          target: usersSchema.id,
        })

      return Ok(user)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to save user',
          operation: 'save',
        }),
      )
    }
  }

  // Mapping logic (infrastructure concern)
  private mapToDomain({ user }: { user: typeof usersSchema.$inferSelect }): Result<User, ValidationError> {
    return User.create({
      createdAt: new Date(user.createdAt),
      email: user.email,
      id: user.id,
      passwordHash: user.passwordHash,
      role: user.role as UserRole,
      updatedAt: new Date(user.updatedAt),
    })
  }
}
```

**❌ DO NOT:**
```typescript
// Generic name
export class UserRepository { // Drizzle? Prisma?
}

// Returns ORM model
async findById(id) {
  return this.db.query.users.findUnique({ where: { id } })
  // Returns ORM model, not Domain entity
}

// No error handling
async save(user) {
  await this.db.insert(usersSchema).values(user.toObject())
  // What if it fails?
}
```

**Applied in:**
- `infrastructure/database/repositories/DrizzleUserRepository.ts`
- `infrastructure/database/repositories/DrizzleTeamRepository.ts`
- `infrastructure/database/repositories/DrizzleRefreshTokenRepository.ts`

---

## 3.2 Dependency Injection - Container Pattern

**Pattern Name:** Composition Root Pattern

**Why:**
- Manual wiring: Explicit, no reflection magic
- Lazy singletons: Getters with private cache
- Type-safe: TypeScript verifies injections
- Testable: Easy to mock
- Zero overhead: No framework, direct
- Centralized: One place to change implementations
- Clear dependencies: Dependency graph is visible

**Real Code Example:**
```typescript
// container.ts
export class Container {
  private _database: Database
  private _userRepository?: IUserRepository
  private _createUserUseCase?: CreateUserUseCase

  constructor(private env: Env, database: Database) {
    this._database = database
  }

  get database(): Database {
    return this._database
  }

  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = DrizzleUserRepository.create({ db: this.database })
    }
    return this._userRepository
  }

  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = CreateUserUseCase.create({
        userRepository: this.userRepository,
        passwordHasher: this.passwordHasher,
      })
    }
    return this._createUserUseCase
  }
}

export function createContainer(env: Env): Container {
  const database = createDatabase(env.DATABASE_URL)
  return new Container(env, database)
}
```

**❌ DO NOT:**
```typescript
// Global mutable
export const container = {
  userRepository: null,
  create() { /* lazy init */ }
}

// Circular dependencies not detected
const userRepo = new DrizzleUserRepository(db)
const loginUC = new LoginUseCase(userRepo) // Needs more deps?

// No factories
export class Container {
  private userRepository = DrizzleUserRepository.create({ db: this.database })
  // Created immediately, not lazy
}
```

**Applied in:**
- `infrastructure/config/container.ts`

---

## 3.3 Configuration - Environment Validation

**Pattern Name:** Fail-Fast Configuration Validation

**Why:**
- Fail-fast: App doesn't start without valid config
- Type-safe: `Env` type for all code
- Defaults: Sensible automatic values
- Validation: URLs, types, minimum lengths
- Production checks: Additional specific validations
- No magic strings: Typed access throughout app

**Real Code Example:**
```typescript
// env.ts
const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://teampulse:teampulse@localhost:5432/teampulse'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
})

export function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    throw new Error('Invalid environment configuration')
  }

  return result.data
}

export type Env = z.infer<typeof envSchema>

// app.ts - Usage
export async function buildApp(): Promise<{ app: FastifyInstance; container: Container }> {
  const env: Env = validateEnv() // Fails here if env is invalid
  validateProductionEnv(env)

  const container = createContainer(env)
  // ...
}
```

**❌ DO NOT:**
```typescript
// Direct access without validation
const dbUrl = process.env.DATABASE_URL
const port = parseInt(process.env.PORT || '3000')
// What if DATABASE_URL is undefined?

// No defaults
const jwtSecret = process.env.JWT_SECRET
// Might be undefined in development

// No types
const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
}
// Any string is valid
```

**Applied in:**
- `infrastructure/config/env.ts`

---

# 4. TESTING PATTERNS

## 4.1 Test Structure - AAA Pattern

**Pattern Name:** Arrange-Act-Assert with Test Builders

**Why:**
- Clear separation: Arrange, Act, Assert explicit
- Named mocks: `buildCreateUserDTO()`, `buildAdminUser()`
- Centralized fixtures: `TEST_CONSTANTS` for values
- Helpers: `expectSuccess()`, `expectErrorType()`
- Organization: Nested `describe()` by behavior
- Independence: `beforeEach` cleans mocks

**Real Code Example:**
```typescript
// CreateUserUseCase.test.ts
describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher

  const mockUser = buildUser({ id: TEST_CONSTANTS.mockUuid })

  beforeEach(() => {
    vi.clearAllMocks()

    // ARRANGE PHASE: Setup mocks
    userRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
      // ...
    }

    passwordHasher = {
      hash: vi.fn(() => Promise.resolve(Ok(TEST_CONSTANTS.users.johnDoe.passwordHash))),
      verify: vi.fn(),
    }

    createUserUseCase = CreateUserUseCase.create({ userRepository, passwordHasher })
  })

  describe('execute', () => {
    it('should create user with valid data', async () => {
      // ARRANGE
      const dto = buildCreateUserDTO()
      vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
      vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

      // ACT
      const result = await createUserUseCase.execute(dto)

      // ASSERT
      const data = expectSuccess(result)
      expect(data).toBeDefined()
      expect(data.id).toBe(TEST_CONSTANTS.mockUuid)
    })
  })
})
```

**❌ DO NOT:**
```typescript
// Without clear separation
it('should create user', async () => {
  const dto = { email: 'test@example.com', password: 'pass', role: 'USER' }
  const repo = { findByEmail: vi.fn(() => Promise.resolve(Ok(null))) }
  const hasher = { hash: vi.fn(() => Promise.resolve(Ok('hash'))) }
  const uc = new CreateUserUseCase(repo, hasher)
  const result = await uc.execute(dto)
  expect(result.ok).toBe(true)
  // Everything mixed
})

// Magic strings
it('should create user', async () => {
  const dto = { email: 'john.doe@example.com', password: 'ValidPass123', role: 'USER' }
  // Where do these values come from?
})
```

**Applied in:**
- `application/use-cases/CreateUserUseCase.test.ts`
- `infrastructure/database/repositories/DrizzleUserRepository.test.ts`

---

## 4.2 Test Builders - Factory Pattern

**Pattern Name:** Builder Pattern for Test Data

**Why:**
- DRY: Reusable default values
- Self-documenting: `buildAdminUser()` clearly creates admin
- Overrides: Customization without duplicating logic
- Validation: Builders throw if data is invalid
- Maintainability: Change in TEST_CONSTANTS propagates to all tests

**Real Code Example:**
```typescript
// user-builders.ts
export function buildCreateUserDTO(overrides: Partial<CreateUserDTO> = {}): CreateUserDTO {
  return {
    email: TEST_CONSTANTS.users.johnDoe.email,
    password: TEST_CONSTANTS.users.johnDoe.password,
    role: TEST_CONSTANTS.users.johnDoe.role,
    ...overrides,
  }
}

export function buildUser(overrides: {
  id?: string
  email?: string
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
} = {}): User {
  const result = User.create({
    createdAt: TEST_CONSTANTS.mockDate,
    email: TEST_CONSTANTS.users.johnDoe.email,
    id: TEST_CONSTANTS.users.johnDoe.id,
    passwordHash: TEST_CONSTANTS.users.johnDoe.passwordHash,
    role: TEST_CONSTANTS.users.johnDoe.role,
    updatedAt: TEST_CONSTANTS.mockDate,
    ...overrides,
  })

  if (!result.ok) {
    throw new Error(`Failed to build User in test: ${result.error.message}`)
  }

  return result.value
}

export function buildAdminUser(overrides = {}): User {
  return buildUser({
    email: TEST_CONSTANTS.users.adminUser.email,
    role: TEST_CONSTANTS.users.adminUser.role,
    ...overrides,
  })
}
```

**❌ DO NOT:**
```typescript
// Duplicated in each test
it('should create admin', () => {
  const admin = new User({
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'ADMIN',
    // ... repeated in 20 tests
  })
})

// No override mechanism
function buildUser() {
  return { email: 'john@example.com', role: 'USER' }
}

it('test with different role', () => {
  const user = buildUser()
  user.role = 'ADMIN' // Mutation
})
```

**Applied in:**
- `infrastructure/testing/user-builders.ts`
- `infrastructure/testing/team-builders.ts`

---

## 4.3 Test Constants - Centralized Values

**Pattern Name:** Test Fixtures Pattern

**Why:**
- Single source of truth: Change in one place
- Type-safe: `as const` allows literal types
- Discoverability: One file to search for values
- Coherence: Same values in all tests
- Maintainability: Easy to extend

**Real Code Example:**
```typescript
// test-constants.ts
export const TEST_CONSTANTS = {
  mockDate: new Date('2025-01-01T00:00:00Z'),
  mockDateIso: '2025-01-01T00:00:00.000Z',
  mockUuid: 'mock-uuid',

  users: {
    johnDoe: {
      email: 'john.doe@example.com',
      id: 'user-123',
      password: 'ValidPass123',
      passwordHash: 'hashed-password',
      role: 'USER' as const,
    },
    adminUser: {
      email: 'admin@example.com',
      id: 'admin-123',
      role: 'ADMIN' as const,
    },
  },

  teams: {
    realMadrid: {
      city: 'Madrid',
      foundedYear: 1902,
      id: 'team-real-madrid',
      name: 'Real Madrid',
    },
  },
} as const
```

**❌ DO NOT:**
```typescript
// Magic values scattered
it('test1', () => {
  const user = buildUser({ email: 'john.doe@example.com' })
})

it('test2', () => {
  const user = buildUser({ email: 'john.doe@example.com' })
  // Duplicated, what if I change the value?
})

// No context
const TEST_VALUES = {
  email: 'john.doe@example.com',
  name: 'John Doe',
  // Is it for user? Team?
}
```

**Applied in:**
- `infrastructure/testing/test-constants.ts`

---

## 4.4 Error Testing - Type-Safe Error Assertions

**Pattern Name:** expectErrorType for All Error Testing

**Why:**
- **Consistency**: Same pattern for single-type and union-type errors
- **Type Safety**: TypeScript correctly narrows error type with instanceof check
- **Explicit**: Test declares expected error type, improving readability
- **Maintainable**: If error types change from single to union, tests still work
- **Self-documenting**: Clear what error the test expects

**The Problem:**
When testing Result types with union errors (e.g., `Result<T, AuthenticationError | ValidationError>`), using `expectError` doesn't provide type narrowing:

```typescript
// ❌ PROBLEM: TypeScript doesn't know which error type
const error = expectError(result) // Type: AuthenticationError | ValidationError
expect(error.field).toBe('email') // ❌ Error: AuthenticationError doesn't have .field
expect(error.metadata?.field).toBe('email') // ❌ Error: ValidationError doesn't have .metadata
```

**The Solution:**
Always use `expectErrorType` which performs instanceof check and narrows the type:

```typescript
// ✅ CORRECT: Type narrowing works correctly
const error = expectErrorType({ errorType: ValidationError, result })
expect(error.field).toBe('email') // ✅ TypeScript knows it's ValidationError

const error = expectErrorType({ errorType: AuthenticationError, result })
expect(error.metadata?.field).toBe('accessToken') // ✅ TypeScript knows it's AuthenticationError
```

**Real Code Example:**
```typescript
// LoginUseCase.test.ts
describe('error cases', () => {
  it('should return AuthenticationError when user does not exist', async () => {
    // ARRANGE
    const dto = buildLoginDTO({ email: TEST_CONSTANTS.emails.nonexistent })
    vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))

    // ACT
    const result = await loginUseCase.execute(dto)

    // ASSERT
    const error = expectErrorType({ errorType: AuthenticationError, result })
    expect(error.message).toBe('Invalid email or password')
    expect(error.metadata?.field).toBe('credentials')
    // ↑ TypeScript knows error is AuthenticationError, not union type
  })

  it('should return ValidationError when email is invalid', async () => {
    // ARRANGE
    const dto = buildLoginDTO({ email: 'invalid-email' })

    // ACT
    const result = await loginUseCase.execute(dto)

    // ASSERT
    const error = expectErrorType({ errorType: ValidationError, result })
    expect(error.field).toBe('email')
    expect(error.message).toContain('Email')
    // ↑ TypeScript knows error is ValidationError, .field exists
  })
})
```

**MANDATORY RULE:**
```typescript
// ✅ ALWAYS use expectErrorType for error assertions
const error = expectErrorType({ errorType: AuthenticationError, result })
expect(error.message).toBe('Invalid credentials')

// ❌ NEVER use expectError for error assertions
const error = expectError(result)
expect(error).toBeInstanceOf(AuthenticationError) // Redundant with expectErrorType
```

**Benefits:**
1. **Works with both single and union error types** - no need to remember which to use
2. **Automatic type narrowing** - no manual type assertions needed
3. **Built-in instanceof check** - eliminates need for separate `toBeInstanceOf` assertion
4. **More explicit** - test clearly states what error it expects
5. **Future-proof** - if error type changes from single to union, test doesn't break

**Helper Implementation:**
```typescript
// packages/shared/src/testing/helpers.ts (lines 108-129)
/**
 * Test helper to assert a Result contains a specific error type
 *
 * This helper allows type-safe extraction of specific error types from union types.
 * It automatically narrows the error type using instanceof check.
 */
export function expectErrorType<E extends Error>({
  result,
  errorType,
}: {
  result: Result<unknown, unknown>
  errorType: Function & { prototype: E }
}): E {
  const error = expectError(result)
  expect(error).toBeInstanceOf(errorType)
  return error as E
}
```

**❌ DO NOT:**
```typescript
// Using expectError without type narrowing
const error = expectError(result)
expect(error).toBeInstanceOf(ValidationError)
expect(error.field).toBe('email') // ❌ Type error with union types

// Using expectError and manual type assertion
const error = expectError(result) as ValidationError
expect(error.field).toBe('email') // ❌ Unsafe, bypasses type checking

// Inconsistent usage - mixing both helpers
const error1 = expectError(result1) // In some tests
const error2 = expectErrorType({ errorType: ValidationError, result2 }) // In other tests
// ❌ Inconsistent, confusing for maintainers
```

**Applied in:**
- `application/use-cases/LoginUseCase.test.ts` (lines 249-323)
- `application/use-cases/RefreshTokenUseCase.test.ts` (lines 249-433)
- `infrastructure/auth/AuthService.test.ts` (lines 75-220)

**Migration Task:**
- See TODO.md: "Estandarizar todos los tests para usar expectErrorType"

---

# 5. TYPE SYSTEM PATTERNS

## 5.1 Result Type - Railway-Oriented

**Pattern Name:** Result<T, E> Type

**Why:**
- Type-safe: TypeScript infers types based on `ok` flag
- No exceptions: Explicit control flow
- Composable: `map()`, `flatMap()`, `collect()`
- Railway oriented: Error path vs success path
- Functional: Monadic pattern

**Real Code Example:**
```typescript
// From @team-pulse/shared
export type Result<T, E> = Ok<T> | Err<E>

export class Ok<T> {
  constructor(public readonly value: T) {}
  readonly ok = true as const
}

export class Err<E> {
  constructor(public readonly error: E) {}
  readonly ok = false as const
}

// Usage
const result = User.create({ email: 'test@example.com', ... })
if (result.ok) {
  const user = result.value
  // result.value is User
} else {
  const error = result.error
  // result.error is ValidationError
}
```

**❌ DO NOT:**
```typescript
// Exceptions
function create(data) {
  if (!data.email) throw new Error("Email required")
}

// null/undefined
function create(data): User | null {
  if (!valid) return null
  // null is error or just not found?
}

// Any
function create(data): any {
  // Client doesn't know return type
}
```

**Applied in:**
- Implementation in `@team-pulse/shared`
- Re-exported from `domain/types/Result.ts`

---

## 5.2 Type Files - Separation Pattern

**Pattern Name:** .types.ts Files

**Why:**
- Separation: Types in own file
- Clarity: Purpose of each type documented
- Reusability: Types shared between files
- Maintainability: Centralized changes
- Composition: Types built on base

**Real Code Example:**
```typescript
// User.types.ts
export interface UserProps {
  id: EntityId
  email: Email
  passwordHash: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export type UserConstructorProps = UserProps

export type CreateUserData = {
  id: string
  email: string
  passwordHash: string
  role: string
  createdAt?: Date
  updatedAt?: Date
}

export type UpdateUserData = Partial<Omit<CreateUserData, 'id'>>

export type UserData = Omit<CreateUserData, 'passwordHash'> & {
  createdAt: Date
  updatedAt: Date
}

// User.ts - Import and re-export
import type { CreateUserData, UserProps } from './User.types.js'

export type { CreateUserData, UserProps }

export class User {
  // ...
}
```

**❌ DO NOT:**
```typescript
// Everything in one file
export class User { ... }
export interface UserProps { ... }
export type CreateUserData = { ... }
// Hard to navigate

// No comments
export interface UserProps {
  id: EntityId
  // What is UserProps exactly?
}
```

**Applied in:**
- `domain/models/User.types.ts`
- `domain/models/Team.types.ts`
- `domain/models/RefreshToken.types.ts`

---

## 5.3 Constants Pattern - Enum-like Constants

**Pattern Name:** Const Object with `as const`

**Why:**
- Single source of truth: Literal values defined in one place
- Type-safe mappings: Enables exhaustive checking in Record types
- Zero typos: Reference constants instead of typing strings
- Better discoverability: IDE autocomplete for available values
- Runtime access: Can iterate, validate, or map values
- Refactoring-friendly: Change value in one place, propagates everywhere

**When to use:**
- Set of related string/number literals used in multiple places
- Values that will be used in type-safe mappings (e.g., Category → HTTP Status)
- Public APIs where values should be well-documented
- Avoiding magic strings/numbers throughout codebase

**Real Code Example:**
```typescript
// packages/shared/src/errors/core.ts

// ✅ Define enum-like constants with as const
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

// Derive type from constant (type follows data)
export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY]
// ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Usage in code
export class ValidationError extends ApplicationError {
  readonly code = 'VALIDATION_ERROR'
  readonly category = ERROR_CATEGORY.VALIDATION // ← Reference constant
  readonly severity = ERROR_SEVERITY.LOW        // ← No typos possible
}

// Type-safe exhaustive mapping
const CATEGORY_TO_HTTP: Record<ErrorCategory, number> = {
  [ERROR_CATEGORY.VALIDATION]: 400,
  [ERROR_CATEGORY.AUTHENTICATION]: 401,
  [ERROR_CATEGORY.AUTHORIZATION]: 403,
  [ERROR_CATEGORY.NOT_FOUND]: 404,
  [ERROR_CATEGORY.CONFLICT]: 409,
  [ERROR_CATEGORY.BUSINESS_RULE]: 422,
  [ERROR_CATEGORY.EXTERNAL]: 502,
  [ERROR_CATEGORY.INTERNAL]: 500,
  // ↑ TypeScript enforces all categories are covered
}
```

**❌ DO NOT:**
```typescript
// Magic strings everywhere
export class ValidationError extends ApplicationError {
  readonly category = 'validation' // ← Typo risk: 'validaton', 'Validation', etc.
  readonly severity = 'low'         // ← What are valid values?
}

// Non-exhaustive mapping (no type safety)
const CATEGORY_TO_HTTP = {
  'validation': 400,
  'authentication': 401,
  // Forgot 'authorization'? TypeScript won't tell you
}

// Redundant const object
export const ERROR_SEVERITY = {
  low: 'low',      // ← Redundant, use enum or direct strings
  medium: 'medium',
}
```

**Naming Convention:**
- Constant name: `SCREAMING_SNAKE_CASE` (e.g., `ERROR_SEVERITY`, `HTTP_STATUS`)
- Properties: `SCREAMING_SNAKE_CASE` for enum-like values (e.g., `LOW`, `NOT_FOUND`)
- Note: Biome config allows `CONSTANT_CASE` for `objectLiteralProperty` to support this pattern

**Applied in:**
- `packages/shared/src/errors/core.ts` - ERROR_SEVERITY, ERROR_CATEGORY
- `apps/api/src/domain/value-objects/Role.ts` - UserRole (enum, similar pattern)

---

# 6. HEXAGONAL ARCHITECTURE

## 6.1 Ports & Adapters Pattern

**Pattern Name:** Hexagonal Architecture (Ports & Adapters)

**Why:**
- Dependency inversion: Application doesn't depend on Infrastructure
- Swappable implementations: Change Drizzle for Prisma without touching domain/application
- Testable: Mocking interfaces is trivial
- Clean separation: Each layer has clear responsibility
- Independent domains: Domain doesn't know HTTP, DB, etc.

**Architecture:**
```
DOMAIN LAYER (Core)
├── Entities (User, Team, RefreshToken)
├── Value Objects (Email, EntityId, Role)
├── Errors (DomainError hierarchy)
└── PORTS (Interfaces)
    ├── IUserRepository
    ├── ITeamRepository
    └── IPasswordHasher

APPLICATION LAYER (Orchestration)
├── Use Cases (CreateUserUseCase, LoginUseCase)
└── Factories (TokenFactory)

INFRASTRUCTURE LAYER (Implementations)
├── ADAPTERS (Implementations)
│   ├── DrizzleUserRepository (IUserRepository)
│   ├── DrizzleTeamRepository (ITeamRepository)
│   └── ScryptPasswordHasher (IPasswordHasher)
├── Database (schema, connection)
├── HTTP (routes, middleware)
└── Config (container, env)
```

**Flow Example:**
```typescript
// 1. DOMAIN defines Port (interface)
export interface IUserRepository {
  findByEmail({ email }: { email: string }): Promise<Result<User | null, RepositoryError>>
}

// 2. APPLICATION uses Port (doesn't know implementation)
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: CreateUserDTO) {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })
    // ↑ Calls interface, doesn't know if Drizzle, Prisma, etc.
  }
}

// 3. INFRASTRUCTURE implements Port (ADAPTER)
export class DrizzleUserRepository implements IUserRepository {
  async findByEmail({ email }): Promise<Result<User | null, RepositoryError>> {
    try {
      const [user] = await this.db.select().from(usersSchema)...
      return Ok(this.mapToDomain({ user }))
    } catch (error) {
      return Err(RepositoryError.forOperation(...))
    }
  }

  private mapToDomain({ user }): Result<User, ValidationError> {
    return User.create({
      email: user.email,
      id: user.id,
      ...
    })
  }
}

// 4. CONTAINER wires everything
export class Container {
  get userRepository(): IUserRepository {
    return DrizzleUserRepository.create({ db: this.database })
  }

  get createUserUseCase(): CreateUserUseCase {
    return CreateUserUseCase.create({
      userRepository: this.userRepository, // ← Injects interface (adapter)
    })
  }
}
```

**❌ DO NOT:**
```typescript
// Application depends on Drizzle
export class CreateUserUseCase {
  constructor(private db: Database) {} // ← Infrastructure dependency

  async execute(dto) {
    const user = await this.db.select().from(users).where(...)
    // Application knows SQL
  }
}

// Circular dependencies
const repository = new Repository(useCase)
const useCase = new CreateUserUseCase(repository)
// Impossible to resolve

// Global singletons
export const userRepository = DrizzleUserRepository.create(...)
// Hard to test, not isolatable
```

**Applied in:**
- All structure in `/apps/api/src/`
- Interfaces in `domain/repositories/` and `domain/services/`
- Implementations in `infrastructure/`
- Orchestration in `application/`

---

## 6.2 Entity Serialization Pattern

**Pattern Name:** Domain Entity Serialization

**Why:**
- Separation: Domain → internal object vs API response
- Security: `toDTO()` doesn't include passwordHash
- Flexibility: `toObject()` retains Date objects, `toDTO()` ISO strings
- Explicit: What is serialized is clear
- Maintainable: Format change in one place

**Real Code Example:**
```typescript
// User.ts
export class User {
  toObject(): UserData {
    return {
      createdAt: this.createdAt,
      email: this.email.getValue(),
      id: this.id.getValue(),
      role: this.role.getValue(),
      updatedAt: this.updatedAt,
    }
    // IMPORTANT: Does NOT include passwordHash for security
  }

  toDTO(): UserResponseDTO {
    return {
      createdAt: this.createdAt.toISOString(),
      email: this.email.getValue(),
      id: this.id.getValue(),
      role: this.role.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
    // Dates converted to ISO strings for JSON serialization
  }
}

// Usage in Use Cases
async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, ...>> {
  // ... create user entity
  const saveUserResult = await this.userRepository.save({ user: createUserResult.value })
  if (!saveUserResult.ok) return Err(saveUserResult.error)

  return Ok(saveUserResult.value.toDTO()) // ← Convert to DTO
}
```

**❌ DO NOT:**
```typescript
// Exposes passwordHash
toDTO(): UserResponseDTO {
  return {
    ...this.toObject(),
    passwordHash: this.passwordHash, // ← Security issue
  }
}

// No serialization
async execute(dto) {
  const user = userEntity // Returns entity directly
  return { user } // Exposes private getters
}

// Mixed types
toDTO(): any {
  return {
    createdAt: this.createdAt, // ← Date, not ISO string
    user: this.toObject(),
    // Inconsistent
  }
}
```

**Applied in:**
- `domain/models/User.ts` (lines 190-214)
- `domain/models/Team.ts` (lines 150-182)

---

## 6.2 Path Aliases - Architecture-Aligned Imports

**Pattern Name:** Layer-Based Path Aliases

**Why:**
- Eliminates deep relative imports (`../../../../domain/...`)
- Makes architectural layers immediately visible in imports
- Self-documenting code: imports show layer dependencies
- Easier refactoring: imports don't break when moving files
- Enforces architectural boundaries through clear naming

**Configuration:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["./src/domain/*"],
      "@application/*": ["./src/application/*"],
      "@infrastructure/*": ["./src/infrastructure/*"]
    }
  }
}

// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@application': fileURLToPath(new URL('./src/application', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
    },
  },
  // ... rest of config
})
```

**Real Code Examples:**

✅ **Correct:**
```typescript
// Before (deep relative imports)
import type { IHistogram } from '../../../../domain/services/metrics/IHistogram.js'
import type { TokenFactory } from '../../../application/factories/TokenFactory.js'
import { ValidationError } from '../../domain/errors/index.js'

// After (architecture-aligned aliases)
import type { IHistogram } from '@domain/services/metrics/IHistogram.js'
import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { ValidationError } from '@domain/errors/index.js'
```

**Benefits Demonstrated:**
```typescript
// Infrastructure/Prometheus/adapters/PrometheusHistogram.ts
// Biome sorts @domain imports FIRST - architecture visibility! ✨
import type { IHistogram } from '@domain/services/metrics/IHistogram.js'
import type * as promClient from 'prom-client'

// Application/TokenFactory.ts
// Clear that Application depends on Domain abstractions
import type { IEnvironment } from '@domain/config/IEnvironment.js'
import { ValidationError } from '@domain/errors/index.js'
import { RefreshToken } from '@domain/models/RefreshToken.js'

// Infrastructure/HTTP/routes/auth.ts
// Clear layer boundaries: Application use cases, not Domain
import type { LoginUseCase } from '@application/use-cases/LoginUseCase.js'
import type { RefreshTokenUseCase } from '@application/use-cases/RefreshTokenUseCase.js'
```

**❌ DO NOT:**
```typescript
// Deep relative imports (hard to read, fragile)
import type { User } from '../../../../domain/models/User.js'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js'

// Single generic alias (loses architecture visibility)
import type { User } from '@/domain/models/User.js'
import type { LoginUseCase } from '@/application/use-cases/LoginUseCase.js'

// Mixing styles
import type { User } from '@domain/models/User.js'
import { ValidationError } from '../../domain/errors/index.js' // ← inconsistent
```

**Import Sorting:**
Biome automatically sorts imports with aliases first, making architectural dependencies highly visible:
```typescript
// Biome sorts: @domain → @application → @infrastructure → external → relative
import type { IEnvironment } from '@domain/config/IEnvironment.js'        // 1. Domain
import type { TokenFactory } from '@application/factories/TokenFactory.js' // 2. Application
import { LoginDTOSchema } from '@team-pulse/shared/dtos'                   // 3. External
import type { FastifyInstance } from 'fastify'                             // 4. External
import { requireAuth } from '../middleware/auth.js'                        // 5. Relative (same layer)
```

**Applied in:**
- All TypeScript files in `apps/api/src/`
- Configuration: `apps/api/tsconfig.json` (lines 9-13)
- Test configuration: `apps/api/vitest.config.ts` (lines 5-11)

---

# 7. MANDATORY AGREEMENTS SUMMARY

## DOMAIN LAYER

### Entities
- ✅ Private constructor + static factory methods (create, fromValueObjects)
- ✅ create() validates primitives, returns Result<Entity, ValidationError>
- ✅ fromValueObjects() without validation
- ✅ update() reuses create()
- ✅ Business methods (hasRole, isAdmin, isExpired)
- ✅ toObject() and toDTO() for serialization
- ❌ NO password/hash exposure in toDTO()

### Value Objects
- ✅ Private constructor
- ✅ static create({ value }) returns Result<VO, ValidationError>
- ✅ Protected static validate*() methods for composition
- ✅ getValue(), equals(), toString(), toJSON()
- ✅ Validations in create(): notempty → format → length

### Errors
- ✅ Extend DomainError
- ✅ code and isOperational properties
- ✅ Factory methods (create, forField, fromZod, forOperation)
- ✅ Contextual information (field, operation, cause)

### Repositories (Interfaces)
- ✅ I-prefix: IUserRepository, ITeamRepository
- ✅ Named parameters: findById({ id })
- ✅ Always return Promise<Result<T, RepositoryError>>
- ❌ NO exceptions, use Result

## APPLICATION LAYER

### Use Cases
- ✅ {Action}{Entity}UseCase naming
- ✅ Private constructor + static create()
- ✅ async execute(dto) method
- ✅ return Promise<Result<ResponseDTO, Errors>>
- ✅ Orchestrate without knowing HTTP/DB
- ✅ Explicit flow: result.ok check in every step

### Factories
- ✅ Centralize creation of complex objects
- ✅ Static methods for low-level operations
- ✅ Instance methods for high-level coordination

## INFRASTRUCTURE LAYER

### Repositories (Implementations)
- ✅ Drizzle{Entity}Repository naming
- ✅ Implement domain port
- ✅ try-catch all methods
- ✅ mapToDomain() private for DB → Entity
- ✅ Return Result<T, RepositoryError>
- ✅ upsert pattern in save()

### Container (DI)
- ✅ Manual wiring (no frameworks)
- ✅ Lazy singletons (getters with cache)
- ✅ Inject interfaces, not implementations
- ✅ createContainer(env) factory method

### Configuration
- ✅ Zod validation at startup
- ✅ validateEnv() throws if invalid
- ✅ Type Env = z.infer

### Error Handling
- ✅ handleError() centralized
- ✅ Domain errors → HTTP status mapping
- ❌ NEVER expose stack traces/internals

## TESTING

### Structure
- ✅ AAA pattern (Arrange, Act, Assert)
- ✅ Builders: buildUser(), buildCreateUserDTO()
- ✅ Constants: TEST_CONSTANTS.users.johnDoe
- ✅ Helpers: expectSuccess(), expectError()

### Builders
- ✅ Sensible default values
- ✅ Support for partial overrides
- ✅ Throw if data is invalid

### Constants
- ✅ Centralized in test-constants.ts
- ✅ as const for type narrowing
- ✅ Categorized by entity

## TYPE SYSTEM

### Result Type
- ✅ Result<T, E> for all fallible operations
- ✅ Ok/Err constructors
- ✅ result.ok checks in flow
- ✅ map(), flatMap(), collect() for composition

### Type Files
- ✅ Separated in .types.ts
- ✅ Re-exported from entity
- ✅ Documented with JSDoc

## HEXAGONAL ARCHITECTURE

### Dependency Direction
- ✅ Domain doesn't import Application nor Infrastructure
- ✅ Application imports Domain, not Infrastructure
- ✅ Infrastructure implements Domain ports
- ✅ Container wires everything in app.ts

### Entity Serialization
- ✅ toObject(): primitives + Dates
- ✅ toDTO(): primitives + ISO strings
- ❌ NEVER include sensitive data in DTO

---

## KEY FILES WHERE PATTERNS ARE APPLIED

**Domain:**
- `domain/models/User.ts`, `Team.ts`, `RefreshToken.ts`
- `domain/value-objects/Email.ts`, `EntityId.ts`, `Role.ts`
- `domain/errors/DomainError.ts`, `ValidationError.ts`
- `domain/repositories/IUserRepository.ts`, `ITeamRepository.ts`

**Application:**
- `application/use-cases/CreateUserUseCase.ts`, `LoginUseCase.ts`
- `application/factories/TokenFactory.ts`

**Infrastructure:**
- `infrastructure/database/repositories/DrizzleUserRepository.ts`
- `infrastructure/auth/ScryptPasswordHasher.ts`
- `infrastructure/config/container.ts`, `env.ts`
- `infrastructure/http/utils/error-handler.ts`

**Testing:**
- `application/use-cases/*.test.ts`
- `infrastructure/testing/user-builders.ts`, `test-constants.ts`

---

**These patterns are MANDATORY and must be enforced in code reviews.**
