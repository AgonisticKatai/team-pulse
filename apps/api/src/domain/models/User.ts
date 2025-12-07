import type { CreateUserData, UpdateUserData, UserConstructorProps, UserData, UserProps } from '@domain/models/User.types.js'
import { IdUtils, type UserId } from '@team-pulse/shared/domain/ids'
import { Email, Role } from '@team-pulse/shared/domain/value-objects'
import type { UserResponseDTO } from '@team-pulse/shared/dtos'
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

// Re-export public types
export type { CreateUserData, UpdateUserData, UserData, UserProps }

/**
 * User Domain Entity
 *
 * Represents an authenticated user in the business domain.
 * This is a RICH DOMAIN MODEL - it encapsulates:
 * - Business data (email, role, etc.)
 * - Business rules (validation, invariants)
 * - Business behavior (methods for domain operations)
 *
 * This entity is FRAMEWORK-AGNOSTIC:
 * - No database dependencies
 * - No HTTP dependencies
 * - Pure TypeScript/JavaScript
 *
 * The infrastructure layer is responsible for persisting this entity.
 *
 * IMPORTANT: Follows the same pattern as Frontend User:
 * - Uses separate .types.ts file
 * - NO fromPersistence() method (use create() with timestamps)
 * - update() calls create() internally
 * - Self-contained DTO mapping
 */
export class User {
  readonly id: UserId
  readonly email: Email
  readonly role: Role
  readonly createdAt: Date
  readonly updatedAt: Date
  private readonly passwordHash: string

  private constructor({ id, email, role, createdAt, updatedAt, passwordHash }: UserConstructorProps) {
    this.id = id
    this.email = email
    this.role = role
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.passwordHash = passwordHash
  }

  /**
   * Validate password hash
   */
  protected static validatePasswordHash({ passwordHash }: { passwordHash: string }): Result<string, ValidationError> {
    if (!passwordHash || passwordHash.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'password', message: 'Password hash is required' }))
    }
    return Ok(passwordHash)
  }

  /**
   * Factory method to create a new User from primitives
   *
   * Use this for:
   * - Creating new users
   * - Reconstituting from database (pass timestamps)
   * - Any scenario where you have primitive values
   *
   * Timestamps are optional - if not provided, will use new Date()
   */
  static create(data: CreateUserData): Result<User, ValidationError> {
    // 1. ID Validation
    if (!IdUtils.isValid(data.id)) {
      return Err(
        ValidationError.create({
          message: 'Invalid User ID format',
          metadata: { field: 'id', value: data.id },
        }),
      )
    }
    // 2. Email Validation
    const emailResult = Email.create({ value: data.email })
    if (!emailResult.ok) {
      return Err(emailResult.error)
    }

    // 3. Password Validation
    const passwordResult = User.validatePasswordHash({
      passwordHash: data.passwordHash,
    })
    if (!passwordResult.ok) {
      return Err(passwordResult.error)
    }

    // 4. Role Validation
    const roleResult = Role.create({ value: data.role })
    if (!roleResult.ok) {
      return Err(roleResult.error)
    }

    return Ok(
      new User({
        createdAt: data.createdAt ?? new Date(),
        email: emailResult.value,
        id: IdUtils.toId<UserId>(data.id),
        passwordHash: passwordResult.value,
        role: roleResult.value,
        updatedAt: data.updatedAt ?? new Date(),
      }),
    )
  }

  /**
   * Factory method to create User from validated Value Objects
   *
   * Use this when you already have validated Value Objects
   * and don't want to re-validate them.
   *
   * NO validation is performed (Value Objects are already validated)
   */
  static fromValueObjects(props: UserProps): User {
    return new User(props)
  }

  /**
   * Get password hash
   *
   * Only used by infrastructure layer for persistence and verification.
   * Should NEVER be exposed via DTOs or API responses.
   */
  getPasswordHash(): string {
    return this.passwordHash
  }

  /**
   * Update user information
   *
   * Returns a new User instance (immutability)
   * Internally calls create() to ensure validation
   */
  update(data: UpdateUserData): Result<User, ValidationError> {
    return User.create({
      createdAt: this.createdAt,
      email: data.email ?? this.email.getValue(),
      id: this.id.getValue(),
      passwordHash: data.passwordHash ?? this.passwordHash,
      role: data.role ?? this.role.getValue(),
      updatedAt: new Date(),
    })
  }

  /**
   * Convert to plain object for serialization
   *
   * IMPORTANT: Does NOT include passwordHash for security
   */
  toObject(): UserData {
    return {
      createdAt: this.createdAt,
      email: this.email.getValue(),
      id: this.id,
      role: this.role.getValue(),
      updatedAt: this.updatedAt,
    }
  }

  /**
   * Convert to UserResponseDTO (for API responses)
   *
   * Dates are converted to ISO strings for JSON serialization
   * IMPORTANT: Does NOT include passwordHash for security
   */
  toDTO(): UserResponseDTO {
    return {
      createdAt: this.createdAt.toISOString(),
      email: this.email.getValue(),
      id: this.id,
      role: this.role.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}
