import type { RefreshTokenFactoryInput, RefreshTokenValueObjects } from '@domain/models/RefreshToken.types.js'
import { IdUtils, type RefreshTokenId, type UserId } from '@team-pulse/shared/domain/ids'
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

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
  readonly id: RefreshTokenId
  readonly token: string
  readonly userId: UserId
  readonly expiresAt: Date
  readonly createdAt: Date

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
  protected static validateToken({ token }: { token: string }): Result<string, ValidationError> {
    if (!token || token.trim().length === 0)
      return Err(ValidationError.forField({ field: 'token', message: 'Refresh token cannot be empty' }))
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
    // Validate token
    const tokenResult = RefreshToken.validateToken({ token: data.token })
    if (!tokenResult.ok) return Err(tokenResult.error)

    return Ok(
      new RefreshToken({
        createdAt: data.createdAt ?? new Date(),
        expiresAt: data.expiresAt,
        id: IdUtils.toId<RefreshTokenId>(data.id),
        token: tokenResult.value,
        userId: IdUtils.toId<UserId>(data.userId),
      }),
    )
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
      id: this.id,
      token: this.token,
      userId: this.userId,
    }
  }
}
