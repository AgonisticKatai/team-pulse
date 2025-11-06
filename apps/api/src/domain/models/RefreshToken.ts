import { ValidationError } from '../errors/index.js'
import { Err, Ok, type Result } from '../types/index.js'
import { EntityId } from '../value-objects/index.js'
import type { RefreshTokenFactoryInput, RefreshTokenValueObjects } from './RefreshToken.types.js'

// Re-export public types
export type { RefreshTokenFactoryInput, RefreshTokenValueObjects }

/**
 * RefreshToken Domain Entity
 *
 * Represents a refresh token for JWT authentication.
 * Refresh tokens are long-lived tokens used to obtain new access tokens.
 *
 * This is a RICH DOMAIN MODEL - it encapsulates:
 * - Business data (token, userId, expiration)
 * - Business rules (validation, invariants)
 * - Business behavior (expiration check)
 *
 * This entity is FRAMEWORK-AGNOSTIC:
 * - No database dependencies
 * - No HTTP dependencies
 * - Pure TypeScript/JavaScript
 *
 * IMPORTANT: Follows the same pattern as User and Team:
 * - Uses separate .types.ts file
 * - NO fromPersistence() method (use create() with timestamps)
 * - Returns Result for error handling
 */
export class RefreshToken {
  public readonly id: EntityId
  public readonly token: string
  public readonly userId: EntityId
  public readonly expiresAt: Date
  public readonly createdAt: Date

  private constructor({ id, token, userId, expiresAt, createdAt }: RefreshTokenValueObjects) {
    this.id = id
    this.token = token
    this.userId = userId
    this.expiresAt = expiresAt
    this.createdAt = createdAt
  }

  /**
   * Validate token is not empty
   */
  private static validateToken({ token }: { token: string }): Result<string, ValidationError> {
    if (!token || token.trim().length === 0) {
      return Err(
        ValidationError.forField({ field: 'token', message: 'Refresh token cannot be empty' }),
      )
    }
    return Ok(token)
  }

  /**
   * Factory method to create a new RefreshToken from primitives
   *
   * Use this for:
   * - Creating new refresh tokens
   * - Reconstituting from database (pass timestamps)
   * - Any scenario where you have primitive values
   *
   * Timestamps are optional - if not provided, will use new Date()
   */
  static create(data: RefreshTokenFactoryInput): Result<RefreshToken, ValidationError> {
    // Validate id
    const [errorId, entityId] = EntityId.create({ value: data.id })
    if (errorId) {
      return Err(errorId)
    }

    // Validate token
    const [errorToken, validatedToken] = RefreshToken.validateToken({ token: data.token })
    if (errorToken) {
      return Err(errorToken)
    }

    // Validate userId
    const [errorUserId, userIdVO] = EntityId.create({ value: data.userId })
    if (errorUserId) {
      return Err(errorUserId)
    }

    return Ok(
      new RefreshToken({
        createdAt: data.createdAt ?? new Date(),
        expiresAt: data.expiresAt,
        id: entityId!,
        token: validatedToken!,
        userId: userIdVO!,
      }),
    )
  }

  /**
   * Factory method to create RefreshToken from validated Value Objects
   *
   * Use this when you already have validated Value Objects
   * and don't want to re-validate them.
   *
   * NO validation is performed (Value Objects are already validated)
   */
  static fromValueObjects(props: RefreshTokenValueObjects): RefreshToken {
    return new RefreshToken(props)
  }

  /**
   * Check if the refresh token has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  /**
   * Check if the refresh token is still valid (not expired)
   */
  isValid(): boolean {
    return !this.isExpired()
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): {
    id: string
    token: string
    userId: string
    expiresAt: Date
    createdAt: Date
  } {
    return {
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      id: this.id.getValue(),
      token: this.token,
      userId: this.userId.getValue(),
    }
  }
}
