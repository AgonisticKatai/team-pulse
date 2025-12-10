# Testing Best Practices

This document outlines the testing patterns and conventions used in the Team Pulse API project.

## Table of Contents

- [Core Principles](#core-principles)
- [Test Helpers](#test-helpers)
- [TEST_CONSTANTS](#test_constants)
- [Test Structure](#test-structure)
- [Common Patterns](#common-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Integration Tests](#integration-tests)
- [Examples](#examples)

## Core Principles

### 1. Type-Safe Testing with Result Pattern

We use the `Result<T, E>` discriminated union for type-safe error handling:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

This pattern eliminates the need for:
- Non-null assertions (`!`)
- Type casting (`as`)
- Manual null checks

### 2. Centralized Test Data

All test data must be defined in `TEST_CONSTANTS` to:
- Eliminate magic values and hardcoded strings
- Improve maintainability
- Make test intent clearer
- Enable reuse across tests

### 3. Arrange-Act-Assert Structure

All tests must follow the AAA pattern with clear comments:

```typescript
it('should do something', () => {
  // Arrange
  const input = TEST_CONSTANTS.emails.valid

  // Act
  const result = Email.create({ value: input })

  // Assert
  const email = expectSuccess(result)
  expect(email.getValue()).toBe('test@example.com')
})
```

## Test Helpers

### expectSuccess

Use `expectSuccess` to assert a Result is successful and extract the value type-safely.

```typescript
// ❌ ANTI-PATTERN: Manual result checking
const result = Email.create({ value: emailString })
expect(result.ok).toBe(true)
if (!result.ok) return
const email = result.value
expect(email.getValue()).toBe('test@example.com')

// ✅ CORRECT: Using expectSuccess
const result = Email.create({ value: emailString })
const email = expectSuccess(result)
expect(email.getValue()).toBe('test@example.com')
```

**Benefits:**
- TypeScript automatically narrows the type
- No need for manual `result.ok` checks
- No need for non-null assertions
- Cleaner, more readable tests

### expectError

Use `expectError` to assert a Result is an error and extract the error type-safely.

```typescript
// ❌ ANTI-PATTERN: Manual error checking
const result = Email.create({ value: '' })
expect(result.ok).toBe(false)
if (result.ok) return
const error = result.error
expect(error).toBeInstanceOf(ValidationError)

// ✅ CORRECT: Using expectError
const result = Email.create({ value: TEST_CONSTANTS.emails.empty })
const error = expectError(result)
expect(error).toBeInstanceOf(ValidationError)
expect(error.message).toContain('Email address is required')
```

**Benefits:**
- TypeScript automatically narrows the type
- No need for manual `!result.ok` checks
- Type-safe error access
- Cleaner, more readable tests

### expectErrorType

Use `expectErrorType` when you need to extract a specific error type from a union.

```typescript
const error = expectErrorType({
  result,
  errorType: ValidationError
})
expect(error.field).toBe('name') // TypeScript knows error is ValidationError
```

### assertDefined

Use `assertDefined` to assert a value is not null or undefined with TypeScript narrowing.

```typescript
const tokens = expectSuccess(result)
expect(tokens).toHaveLength(1)

const [firstToken] = tokens
assertDefined(firstToken) // TypeScript now knows firstToken is defined
expect(firstToken.userId.getValue()).toBe('user-1')
```

**Use cases:**
- Array destructuring where TypeScript can't infer element existence
- Optional properties that you know will be present in tests
- Nullable database query results

### expectDefined

Similar to `expectSuccess` but also checks that the value is defined.

```typescript
const value = expectDefined(result)
// value is guaranteed to be defined (not null or undefined)
```

### expectSingle

Use `expectSingle` when you expect a Result to contain an array with exactly one element.

```typescript
// ❌ ANTI-PATTERN: Manual array checking
const tokens = expectSuccess(result)
expect(tokens).toHaveLength(1)
const [firstToken] = tokens
assertDefined(firstToken)
expect(firstToken.userId.getValue()).toBe('user-1')

// ✅ CORRECT: Using expectSingle
const token = expectSingle(result)
expect(token.userId.getValue()).toBe('user-1')
```

**Benefits:**
- Combines success assertion, length check, and element extraction
- Perfect for repository queries that return a single result
- Type-safe with no need for optional chaining
- Cleaner, more concise tests

### expectFirst

Use `expectFirst` to extract the first element of an array with type safety.

```typescript
// ❌ ANTI-PATTERN: Optional chaining
const teams = expectSuccess(result)
expect(teams[0]?.name).toBe('FC Barcelona')

// ✅ CORRECT: Using expectFirst
const teams = expectSuccess(result)
const firstTeam = expectFirst(teams)
expect(firstTeam.name).toBe('FC Barcelona')
```

**Benefits:**
- Asserts array is non-empty
- Extracts first element with type safety
- No need for optional chaining (`?.`)
- Clearer test intent

### expectArrayOfLength

Use `expectArrayOfLength` to combine success assertion with length check.

```typescript
// ❌ ANTI-PATTERN: Separate assertions
const teams = expectSuccess(result)
expect(teams).toHaveLength(3)

// ✅ CORRECT: Using expectArrayOfLength
const teams = expectArrayOfLength(result, 3)
```

**Benefits:**
- Combines two common assertions into one
- More concise
- Returns type-safe array for further assertions

## TEST_CONSTANTS

All test data must be defined in `test-constants.ts` and organized by domain.

### Available Constants

#### Email Test Data

```typescript
TEST_CONSTANTS.emails = {
  empty: '',
  valid: 'test@example.com',
  uppercase: 'TEST@EXAMPLE.COM',
  lowercase: 'test@example.com',
  withSpaces: '  test@example.com  ',
  whitespaceOnly: '   ',
  noAt: 'notanemail.com',
  noDomain: 'user@',
  noLocal: '@example.com',
  noExtension: 'user@domain',
  tooLong: '...', // 256 characters
  validExactly255: '...', // exactly 255 characters
  withDot: 'user.name@example.com',
  withPlus: 'user+tag@example.co.uk',
  withUnderscore: 'user_name@example-domain.com',
  withNumbers: 'user123@test123.com',
  withSubdomain: 'user@mail.example.com',
}
```

#### EntityId Test Data

```typescript
TEST_CONSTANTS.ids = {
  empty: '',
  user123: 'user-123',
  user456: 'user-456',
  alphanumeric: 'a1b2c3',
  whitespaceOnly: '   ',
  withUnderscore: 'user_123',
  withUpperCase: 'User-123',
  withSpaces: 'user 123', // invalid
  withDots: 'user.123', // invalid
  withAt: 'user@123', // invalid
}
```

#### Password Test Data

```typescript
TEST_CONSTANTS.passwords = {
  test: 'TestPassword123!',
  initial: 'InitialPassword123!',
  updated: 'UpdatedPassword456!',
  different: 'DifferentPassword456!',
  wrong: 'WrongPassword456!',
  lowercase: 'testpassword123!',
}
```

#### Refresh Token Test Data

```typescript
TEST_CONSTANTS.refreshTokens = {
  test: 'test-refresh-token-123',
  initial: 'initial-token',
  updated: 'updated-token',
  unique: 'unique-token-123',
  user1Token: 'user1-token',
  user2Token: 'user2-token',
}
```

#### Team Test Data

```typescript
TEST_CONSTANTS.teams = {
  fcBarcelona: {
    id: 'team-fc-barcelona',
    name: 'FC Barcelona',
  },
  realMadrid: {
    id: 'team-real-madrid',
    name: 'Real Madrid',
  },
  // ... more teams
}
```

#### User Test Data

```typescript
TEST_CONSTANTS.users = {
  johnDoe: {
    id: 'user-123',
    email: 'john.doe@example.com',
    password: 'ValidPass123',
    passwordHash: 'hashed-password',
    role: 'USER',
  },
  adminUser: {
    id: 'admin-123',
    email: 'admin@example.com',
    password: 'AdminPass123',
    passwordHash: 'hashed-admin-password',
    role: 'ADMIN',
  },
  // ... more users
}
```

### When to Add New Constants

Add new constants when:
- You're writing a new test that needs test data
- You find yourself hardcoding a value in a test
- Multiple tests need the same test value
- The value has specific meaning (e.g., "exactly 255 chars")

### How to Add New Constants

1. Identify the domain (emails, ids, passwords, etc.)
2. Choose a descriptive name that explains the value's purpose
3. Add to the appropriate section in `test-constants.ts`
4. Use `as const` to ensure type safety

```typescript
export const TEST_CONSTANTS = {
  emails: {
    // ... existing constants
    newConstant: 'value@example.com', // Add here
  },
} as const
```

## Test Structure

### Value Object Tests

Value objects should test:
- Creation with valid values
- Normalization (trimming, lowercasing, etc.)
- Validation (empty, too long, invalid format, etc.)
- Edge cases (exactly max length, boundary values)
- Public methods (getValue, equals, toString, toJSON)
- Immutability

**Example:**

```typescript
describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.valid

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should fail with empty string', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.empty

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })
  })

  describe('equals', () => {
    it('should return true for same email', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))
      const email2 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(true)
    })
  })
})
```

### Repository Tests

Repository tests should test:
- CRUD operations (create, findById, findAll, update, delete)
- Query operations (findByEmail, etc.)
- Edge cases (not found, duplicates, etc.)
- Database constraints

**Setup:**

```typescript
describe('DrizzleUserRepository', () => {
  const { getDatabase } = setupTestEnvironment()
  let repository: DrizzleUserRepository

  beforeEach(() => {
    repository = new DrizzleUserRepository(getDatabase())
  })
})
```

**Example:**

```typescript
it('should save and retrieve user by ID', async () => {
  // Arrange
  const userResult = User.create({
    email: TEST_CONSTANTS.testEmails.user1,
    password: TEST_CONSTANTS.passwords.test,
    role: 'USER',
  })
  const user = expectSuccess(userResult)

  // Act
  await repository.save({ user })
  const foundUser = await repository.findById({ id: user.id })

  // Assert
  assertDefined(foundUser)
  expect(foundUser.id.getValue()).toBe(user.id.getValue())
  expect(foundUser.email.getValue()).toBe(TEST_CONSTANTS.testEmails.user1)
})
```

### Use Case Tests

Use case tests should test:
- Happy path (successful execution)
- Validation errors
- Business logic errors
- Authorization checks
- Edge cases

**Example:**

```typescript
describe('LoginUseCase', () => {
  it('should login user with valid credentials', async () => {
    // Arrange
    const dto = {
      email: TEST_CONSTANTS.testEmails.user1,
      password: TEST_CONSTANTS.passwords.test,
    }

    // Act
    const result = await useCase.execute({ dto })

    // Assert
    const tokens = expectSuccess(result)
    expect(tokens.accessToken).toBeDefined()
    expect(tokens.refreshToken).toBeDefined()
  })

  it('should fail with invalid credentials', async () => {
    // Arrange
    const dto = {
      email: TEST_CONSTANTS.testEmails.user1,
      password: TEST_CONSTANTS.passwords.wrong,
    }

    // Act
    const error = expectError(await useCase.execute({ dto }))

    // Assert
    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.message).toContain('Invalid credentials')
  })
})
```

## Common Patterns

### Testing Array Results

```typescript
it('should return list of teams', async () => {
  // Arrange
  await createTestTeams()

  // Act
  const result = await useCase.execute({ dto: {} })

  // Assert
  const teams = expectSuccess(result)
  expect(teams).toHaveLength(2)

  const [firstTeam] = teams
  assertDefined(firstTeam)
  expect(firstTeam.name.getValue()).toBe('FC Barcelona')
})
```

### Testing Pagination

```typescript
it('should return paginated results', async () => {
  // Arrange
  const paginationDto = { page: 1, limit: 10 }

  // Act
  const result = await useCase.execute({ dto: paginationDto })

  // Assert
  const response = expectSuccess(result)
  expect(response.data).toHaveLength(10)
  expect(response.pagination.page).toBe(1)
  expect(response.pagination.total).toBeGreaterThan(10)
})
```

### Testing Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should accept email with exactly 255 characters', () => {
    // Arrange
    const emailString = TEST_CONSTANTS.emails.validExactly255

    // Act
    const email = expectSuccess(Email.create({ value: emailString }))

    // Assert
    expect(email).toBeDefined()
    expect(email.getValue().length).toBe(255)
  })

  it('should fail with email exceeding 255 characters', () => {
    // Arrange
    const emailString = TEST_CONSTANTS.emails.tooLong

    // Act
    const error = expectError(Email.create({ value: emailString }))

    // Assert
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toContain('must not exceed 255 characters')
  })
})
```

## Anti-Patterns to Avoid

### ❌ Manual Result Checking

```typescript
// DON'T DO THIS
const result = Email.create({ value: 'test@example.com' })
expect(result.ok).toBe(true)
if (!result.ok) return
const email = result.value
```

### ❌ Hardcoded Test Values

```typescript
// DON'T DO THIS
const email = 'test@example.com'
const password = 'TestPassword123!'

// DO THIS INSTEAD
const email = TEST_CONSTANTS.emails.valid
const password = TEST_CONSTANTS.passwords.test
```

### ❌ Non-Null Assertions

```typescript
// DON'T DO THIS
const user = await repository.findById({ id })
expect(user!.email).toBe('test@example.com')

// DO THIS INSTEAD
const user = await repository.findById({ id })
assertDefined(user)
expect(user.email.getValue()).toBe(TEST_CONSTANTS.emails.valid)
```

### ❌ Missing Arrange-Act-Assert Comments

```typescript
// DON'T DO THIS
it('should create email', () => {
  const email = expectSuccess(Email.create({ value: 'test@example.com' }))
  expect(email.getValue()).toBe('test@example.com')
})

// DO THIS INSTEAD
it('should create email', () => {
  // Arrange
  const emailString = TEST_CONSTANTS.emails.valid

  // Act
  const email = expectSuccess(Email.create({ value: emailString }))

  // Assert
  expect(email.getValue()).toBe('test@example.com')
})
```

### ❌ Unclear Test Names

```typescript
// DON'T DO THIS
it('test 1', () => { /* ... */ })
it('works', () => { /* ... */ })

// DO THIS INSTEAD
it('should create valid email', () => { /* ... */ })
it('should fail with empty string', () => { /* ... */ })
```

## Integration Tests

### Setup Test Environment

Use `setupTestEnvironment()` helper to:
- Set required environment variables
- Create isolated PostgreSQL test container
- Configure DATABASE_URL
- Handle cleanup

**Basic Usage:**

```typescript
describe('MyRepository', () => {
  setupTestEnvironment()

  it('should do something', async () => {
    // Your test code here
  })
})
```

**With Database Access:**

```typescript
describe('MyRepository', () => {
  const { getDatabase } = setupTestEnvironment()
  let repository: MyRepository

  beforeEach(() => {
    repository = new MyRepository(getDatabase())
  })

  it('should do something', async () => {
    // Your test code here
  })
})
```

### Cleaning Test Data

For tests that need a clean database state:

```typescript
beforeEach(async () => {
  const db = getDatabase()
  await db.execute(sql`TRUNCATE TABLE users CASCADE`)
  await db.execute(sql`TRUNCATE TABLE teams CASCADE`)
})
```

## Examples

### Complete Value Object Test

```typescript
import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { ValidationError } from '../errors/index.js'
import { Email } from './Email.js'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.valid

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.uppercase

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should fail with empty string', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.empty

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })
  })
})
```

### Complete Repository Test

```typescript
import { describe, expect, it, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { assertDefined, expectSuccess, setupTestEnvironment, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { User } from '../../domain/entities/index.js'
import { DrizzleUserRepository } from './DrizzleUserRepository.js'

describe('DrizzleUserRepository', () => {
  const { getDatabase } = setupTestEnvironment()
  let repository: DrizzleUserRepository

  beforeEach(async () => {
    repository = new DrizzleUserRepository(getDatabase())
    await getDatabase().execute(sql`TRUNCATE TABLE users CASCADE`)
  })

  it('should save and retrieve user by ID', async () => {
    // Arrange
    const userResult = User.create({
      email: TEST_CONSTANTS.testEmails.user1,
      password: TEST_CONSTANTS.passwords.test,
      role: 'USER',
    })
    const user = expectSuccess(userResult)

    // Act
    await repository.save({ user })
    const foundUser = await repository.findById({ id: user.id })

    // Assert
    assertDefined(foundUser)
    expect(foundUser.id.getValue()).toBe(user.id.getValue())
    expect(foundUser.email.getValue()).toBe(TEST_CONSTANTS.testEmails.user1)
  })
})
```

## Summary

1. **Always use test helpers**: `expectSuccess`, `expectError`, `assertDefined`
2. **Always use TEST_CONSTANTS**: No hardcoded values in tests
3. **Always use AAA structure**: Arrange, Act, Assert with comments
4. **Write descriptive test names**: "should [expected behavior] when [condition]"
5. **Test edge cases**: Boundaries, empty values, max lengths
6. **Keep tests focused**: One assertion per test (when possible)
7. **Clean up test data**: Use beforeEach/afterEach for isolation
8. **Use type-safe patterns**: Leverage TypeScript's type narrowing

For questions or suggestions, please discuss with the team.
