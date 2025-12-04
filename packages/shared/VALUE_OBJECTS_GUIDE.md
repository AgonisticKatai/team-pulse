# Value Objects Implementation Guide

This guide documents the established patterns and best practices for creating Value Objects in the TeamPulse shared kernel, based on proven implementations of `Role` and `EntityId`.

## Table of Contents

1. [Core Principles](#core-principles)
2. [File Structure](#file-structure)
3. [Implementation Pattern](#implementation-pattern)
4. [Testing Strategy](#testing-strategy)
5. [Common Patterns](#common-patterns)
6. [Examples](#examples)

---

## Core Principles

### The Golden Rules

1. **Immutability First**: Once created, a Value Object cannot be modified
2. **Self-Validation**: Value Objects validate themselves during creation
3. **Result Pattern**: Always use `Result<T, Error>` for operations that can fail
4. **Behavioral Objects**: Value Objects contain both data AND behavior
5. **No Infrastructure Dependencies**: Pure domain logic only, no DB, HTTP, or UI imports
6. **Branded Types for Type Safety**: Use TypeScript branded types to prevent mixing incompatible IDs

### When to Create a Value Object

Create a Value Object when:
- ✅ A concept has validation rules (Email, UUID, Status)
- ✅ A concept has behavior beyond data storage (Price calculations, Status transitions)
- ✅ You want type safety at compile time (different entity IDs)
- ✅ The logic depends ONLY on the value itself

Don't create a Value Object when:
- ❌ It's just a type alias with no validation
- ❌ The behavior requires external dependencies or side effects
- ❌ It needs to call APIs or access databases

---

## File Structure

Every Value Object follows this standardized structure:

```
/packages/shared/src/domain/value-objects/{ValueObjectName}/
├── index.ts                    # Barrel export
├── {ValueObjectName}.ts        # Main implementation
├── {ValueObjectName}.test.ts   # Comprehensive tests
├── {ValueObjectName}.schema.ts # Zod validation schema
└── {ValueObjectName}.types.ts  # TypeScript type definitions
```

### Example: Role Value Object

```
/packages/shared/src/domain/value-objects/Role/
├── index.ts
├── Role.ts
├── Role.test.ts
├── Role.schema.ts
└── Role.types.ts
```

---

## Implementation Pattern

### 1. Schema File (`{ValueObjectName}.schema.ts`)

Define validation using Zod. This is the single source of truth for valid values.

```typescript
import { z } from 'zod'

/**
 * Zod schema for Role validation
 * Ensures only valid role values are accepted
 */
export const roleSchema = z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'], {
  errorMap: () => ({ message: 'Invalid role value' }),
})
```

**Key Points:**
- Use descriptive error messages
- Keep it simple and focused on format validation
- Export the schema for reuse in DTOs

### 2. Types File (`{ValueObjectName}.types.ts`)

Extract TypeScript types from the schema. Never duplicate type definitions.

```typescript
import { z } from 'zod'
import { roleSchema } from './Role.schema'

/**
 * Valid role type inferred from schema
 * This ensures types stay in sync with validation
 */
export type RoleType = z.infer<typeof roleSchema>
```

**Key Points:**
- Always use `z.infer` to derive types from schemas
- Single source of truth prevents drift between types and validation

### 3. Main Implementation (`{ValueObjectName}.ts`)

The core Value Object implementation following the established pattern.

#### Template Structure:

```typescript
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { valueObjectSchema } from './ValueObject.schema'
import type { ValueObjectType } from './ValueObject.types'

/**
 * ValueObject Value Object
 *
 * [Brief description of what this represents]
 * [Key invariants and rules]
 *
 * @example
 * const result = ValueObject.create({ value: 'valid-value' })
 * if (result.ok) {
 *   console.log(result.value.getValue())
 * }
 */
export class ValueObject {
  private readonly value: ValueObjectType

  private constructor({ value }: { value: ValueObjectType }) {
    this.value = value
  }

  /**
   * Create a ValueObject from a raw value
   *
   * @param value - The raw value to validate and wrap
   * @returns Result containing the ValueObject or a ValidationError
   */
  static create({ value }: { value: string }): Result<ValueObject, ValidationError> {
    const validationResult = ValueObject.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'fieldName',
          message: 'Validation failed message',
          value,
        }),
      )
    }

    return Ok(new ValueObject({ value: validationResult.value }))
  }

  /**
   * Validate a raw value without creating a ValueObject
   *
   * @param value - The value to validate
   * @returns Result containing the validated value or an error
   */
  static validate({ value }: { value: string }): Result<ValueObjectType, ValidationError> {
    const result = valueObjectSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.invalidValue({
          field: 'fieldName',
          message: 'Validation failed message',
          value,
        }),
      )
    }

    return Ok(result.data)
  }

  /**
   * Check if a value is valid without creating the object
   *
   * @param value - The value to check
   * @returns true if valid, false otherwise
   */
  static isValid({ value }: { value: string }): boolean {
    return valueObjectSchema.safeParse(value).success
  }

  /**
   * Get the primitive value
   */
  getValue(): ValueObjectType {
    return this.value
  }

  /**
   * Check equality with another ValueObject
   */
  equals({ other }: { other: ValueObject }): boolean {
    return this.value === other.value
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.value
  }

  // Add domain-specific behavior methods here
  // Example: isAdmin(), canEdit(), etc.
}
```

#### Key Implementation Rules:

1. **Private Constructor**
   - Prevents direct instantiation
   - Forces use of factory methods
   - Ensures validation always happens

2. **Named Parameters**
   - Use object destructuring: `{ value }` instead of `value`
   - Makes code more readable and maintainable
   - Easier to add optional parameters later

3. **Static Factory Methods**
   - `create()`: Main factory, validates and creates
   - `validate()`: Validates without creating (useful for pre-validation)
   - `isValid()`: Boolean check (useful for guards)

4. **Essential Methods**
   - `getValue()`: Access the wrapped value
   - `equals()`: Compare with another instance
   - `toString()`: String representation

5. **Result Pattern**
   - Never throw exceptions in domain logic
   - Always return `Result<T, Error>`
   - Use `Ok()` for success, `Err()` for failure

### 4. Branded Types Pattern (for IDs)

When creating ID Value Objects, use branded types for type safety:

```typescript
/**
 * EntityId Value Object with Branded Types
 *
 * Uses TypeScript branded types to provide compile-time type safety,
 * preventing mixing of different entity IDs.
 *
 * @example
 * const userId = EntityId.create<'User'>({ value: '...' })
 * const teamId = EntityId.create<'Team'>({ value: '...' })
 * // userId and teamId are incompatible types at compile time
 *
 * @template Brand - A string literal type that brands this ID
 */
export class EntityId<Brand extends string = string> {
  private readonly value: EntityIdType
  declare readonly _brand: Brand

  private constructor({ value }: { value: EntityIdType }) {
    this.value = value
  }

  static create<B extends string = string>({
    value
  }: {
    value: string
  }): Result<EntityId<B>, ValidationError> {
    // ... validation logic
    return Ok(new EntityId({ value: validationResult.value }) as EntityId<B>)
  }

  equals({ other }: { other: EntityId<Brand> }): boolean {
    return this.value === other.value
  }
}
```

**Branded Types Benefits:**
- `EntityId<'User'>` and `EntityId<'Team'>` are different types
- Compiler prevents mixing different entity IDs
- Zero runtime cost, purely compile-time safety

---

## Testing Strategy

### Test File Structure

```typescript
import { ValidationError } from '@team-pulse/shared/errors'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { ValueObject } from './ValueObject'

describe('ValueObject', () => {
  const { testData } = TEST_CONSTANTS

  describe('create', () => {
    // Happy path tests
    // Validation error tests
  })

  describe('validate', () => {
    // Validation tests
  })

  describe('isValid', () => {
    // Boolean validation tests
  })

  describe('equals', () => {
    // Equality tests
  })

  describe('getValue', () => {
    // Value access tests
  })

  describe('toString', () => {
    // String conversion tests
  })

  describe('domain behavior', () => {
    // Domain-specific behavior tests
  })
})
```

### Testing Principles

1. **Use Test Constants**
   ```typescript
   // ❌ Don't hardcode values
   const result = Role.create({ value: 'ADMIN' })

   // ✅ Use centralized constants
   const { roles } = TEST_CONSTANTS
   const result = Role.create({ value: roles.admin })
   ```

2. **Avoid Implementation Details**
   ```typescript
   // ❌ Testing internal format (fragile)
   expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-.../)

   // ✅ Test behavior (flexible)
   expect(EntityId.isValidId({ value: entityId.getValue() })).toBe(true)
   ```

3. **Use @ts-expect-error for Type Tests**
   ```typescript
   // ✅ Verifies type safety is maintained
   it('should prevent comparing different brands', () => {
     const userId = expectSuccess(EntityId.create<'User'>({ value: uuids.user1 }))
     const teamId = expectSuccess(EntityId.create<'Team'>({ value: uuids.team1 }))

     // This MUST fail compilation. If it doesn't, test fails
     // @ts-expect-error - Different brands cannot be compared
     userId.equals({ other: teamId })
   })
   ```

4. **Test Coverage Requirements**
   - ✅ Valid value creation
   - ✅ Invalid value rejection
   - ✅ Edge cases (empty, null, undefined)
   - ✅ Equality comparison
   - ✅ All domain-specific behaviors
   - ✅ Branded type safety (for IDs)

### Test Constants

Add test data to `/packages/shared/src/testing/constants.ts`:

```typescript
export const TEST_CONSTANTS = {
  // Your domain
  yourDomain: {
    valid: 'valid-value',
    invalid: 'invalid-value',
    edge: 'edge-case',
  },
} as const
```

---

## Common Patterns

### Pattern 1: Enum-Based Value Objects (like Role)

**When to use:** Fixed set of valid values

```typescript
// Schema
export const statusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])

// Value Object
export class Status {
  private readonly value: StatusType

  // Domain behavior
  isEditable(): boolean {
    return this.value === 'DRAFT'
  }

  canBeActivated(): boolean {
    return this.value === 'DRAFT'
  }

  canBeArchived(): boolean {
    return this.value === 'ACTIVE'
  }
}
```

### Pattern 2: ID Value Objects with Branded Types (like EntityId)

**When to use:** Unique identifiers that need type safety

```typescript
export class ProductId<Brand extends string = 'Product'> {
  private readonly value: string
  declare readonly _brand: Brand

  static create<B extends string = 'Product'>({
    value
  }: {
    value: string
  }): Result<ProductId<B>, ValidationError> {
    // Validation logic
  }

  static generate<B extends string = 'Product'>(): Result<ProductId<B>, ValidationError> {
    return ProductId.create({ value: uuidv4() })
  }
}
```

### Pattern 3: Formatted String Value Objects (like Email)

**When to use:** Values with specific format requirements

```typescript
// Schema
export const emailSchema = z
  .string()
  .email()
  .max(255)
  .transform((email) => email.toLowerCase().trim())

// Value Object
export class Email {
  private readonly value: EmailType

  // Domain behavior
  getDomain(): string {
    return this.value.split('@')[1]
  }

  isFromDomain({ domain }: { domain: string }): boolean {
    return this.getDomain() === domain
  }
}
```

### Pattern 4: Numeric Value Objects with Constraints (like Price)

**When to use:** Numeric values with business rules

```typescript
// Schema
export const priceSchema = z
  .number()
  .positive()
  .finite()
  .transform((price) => Math.round(price * 100) / 100) // Round to 2 decimals

// Value Object
export class Price {
  private readonly value: number

  add({ other }: { other: Price }): Price {
    const result = Price.create({ value: this.value + other.value })
    // Assuming validation always passes for arithmetic results
    if (!result.ok) throw new Error('Unexpected validation error')
    return result.value
  }

  multiply({ factor }: { factor: number }): Price {
    const result = Price.create({ value: this.value * factor })
    if (!result.ok) throw new Error('Unexpected validation error')
    return result.value
  }

  isGreaterThan({ other }: { other: Price }): boolean {
    return this.value > other.value
  }
}
```

---

## Examples

### Complete Example: Status Value Object

```typescript
// Status.schema.ts
import { z } from 'zod'

export const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
  errorMap: () => ({ message: 'Invalid status' }),
})

// Status.types.ts
import { z } from 'zod'
import { statusSchema } from './Status.schema'

export type StatusType = z.infer<typeof statusSchema>

// Status.ts
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { statusSchema } from './Status.schema'
import type { StatusType } from './Status.types'

export class Status {
  private readonly value: StatusType

  private constructor({ value }: { value: StatusType }) {
    this.value = value
  }

  static create({ value }: { value: string }): Result<Status, ValidationError> {
    const validationResult = Status.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'status',
          message: 'Invalid status value',
          value,
        }),
      )
    }

    return Ok(new Status({ value: validationResult.value }))
  }

  static validate({ value }: { value: string }): Result<StatusType, ValidationError> {
    const result = statusSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.invalidValue({
          field: 'status',
          message: 'Invalid status value',
          value,
        }),
      )
    }

    return Ok(result.data)
  }

  static isValid({ value }: { value: string }): boolean {
    return statusSchema.safeParse(value).success
  }

  getValue(): StatusType {
    return this.value
  }

  equals({ other }: { other: Status }): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  // Domain behavior
  isEditable(): boolean {
    return this.value === 'DRAFT'
  }

  canPublish(): boolean {
    return this.value === 'DRAFT'
  }

  canArchive(): boolean {
    return this.value === 'PUBLISHED'
  }

  isFinal(): boolean {
    return this.value === 'ARCHIVED'
  }
}

// Status.test.ts
import { ValidationError } from '@team-pulse/shared/errors'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { Status } from './Status'

describe('Status', () => {
  const { statuses } = TEST_CONSTANTS

  describe('create', () => {
    it('should create a valid Status', () => {
      const result = Status.create({ value: statuses.draft })
      const status = expectSuccess(result)
      expect(status.getValue()).toBe(statuses.draft)
    })

    it('should return error for invalid status', () => {
      const result = Status.create({ value: statuses.invalid })
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe('Invalid status value')
    })
  })

  describe('domain behavior', () => {
    it('should identify editable statuses', () => {
      const draft = expectSuccess(Status.create({ value: statuses.draft }))
      const published = expectSuccess(Status.create({ value: statuses.published }))

      expect(draft.isEditable()).toBe(true)
      expect(published.isEditable()).toBe(false)
    })

    it('should enforce publish rules', () => {
      const draft = expectSuccess(Status.create({ value: statuses.draft }))
      const archived = expectSuccess(Status.create({ value: statuses.archived }))

      expect(draft.canPublish()).toBe(true)
      expect(archived.canPublish()).toBe(false)
    })
  })
})
```

---

## Checklist for New Value Objects

Before committing a new Value Object, verify:

- [ ] Schema file uses Zod for validation
- [ ] Types file uses `z.infer` from schema
- [ ] Private constructor prevents direct instantiation
- [ ] Factory method `create()` validates input
- [ ] `validate()` method for pre-validation
- [ ] `isValid()` method for boolean checks
- [ ] `getValue()` returns the wrapped value
- [ ] `equals()` compares with other instances
- [ ] `toString()` provides string representation
- [ ] Domain-specific behavior methods included
- [ ] Test file covers all methods and edge cases
- [ ] Test constants added to `TEST_CONSTANTS`
- [ ] No hardcoded test values
- [ ] Branded types used for IDs (if applicable)
- [ ] `@ts-expect-error` used for type safety tests
- [ ] JSDoc comments on all public methods
- [ ] No infrastructure dependencies

---

## Common Mistakes to Avoid

### ❌ Don't: Public Mutable Properties

```typescript
// BAD
export class Email {
  public value: string // Can be changed!

  constructor(value: string) {
    this.value = value
  }
}
```

### ✅ Do: Private Immutable Properties

```typescript
// GOOD
export class Email {
  private readonly value: EmailType

  private constructor({ value }: { value: EmailType }) {
    this.value = value
  }
}
```

### ❌ Don't: Throw Exceptions

```typescript
// BAD
static create({ value }: { value: string }): Email {
  if (!isValid(value)) {
    throw new Error('Invalid email')
  }
  return new Email({ value })
}
```

### ✅ Do: Return Result

```typescript
// GOOD
static create({ value }: { value: string }): Result<Email, ValidationError> {
  if (!isValid(value)) {
    return Err(ValidationError.invalidValue({ ... }))
  }
  return Ok(new Email({ value }))
}
```

### ❌ Don't: Duplicate Validation Logic

```typescript
// BAD
static create({ value }: { value: string }): Result<Email, ValidationError> {
  if (!value.includes('@')) { // Validation logic here
    return Err(...)
  }
  return Ok(new Email({ value }))
}
```

### ✅ Do: Use Schema for Validation

```typescript
// GOOD
static create({ value }: { value: string }): Result<Email, ValidationError> {
  const validationResult = Email.validate({ value }) // Schema handles it
  if (!validationResult.ok) {
    return Err(...)
  }
  return Ok(new Email({ value: validationResult.value }))
}
```

---

## Resources

- Global Architecture Strategy: `/GLOBAL_ARCHITECTURE_STRATEGY.md`
- Test Constants: `/packages/shared/src/testing/constants.ts`
- Test Helpers: `/packages/shared/src/testing/helpers.ts`
- Error Types: `/packages/shared/src/errors/`
- Result Pattern: `/packages/shared/src/result/`

---

**Last Updated:** 2025-01-04
**Maintainers:** Development Team
