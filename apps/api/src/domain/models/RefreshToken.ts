import { ValidationError } from '../errors/index.js'

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
 */
export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {
    // Validate business invariants
    this.validateInvariants()
  }

  /**
   * Factory method to create a new RefreshToken
   *
   * Use this instead of constructor for new tokens (not from DB)
   */
  static create(data: {
    id: string
    token: string
    userId: string
    expiresAt: Date
  }): RefreshToken {
    return new RefreshToken(data.id, data.token, data.userId, data.expiresAt, new Date())
  }

  /**
   * Factory method to reconstitute a RefreshToken from persistence
   *
   * Use this when loading from database
   */
  static fromPersistence(data: {
    id: string
    token: string
    userId: string
    expiresAt: Date
    createdAt: Date
  }): RefreshToken {
    return new RefreshToken(data.id, data.token, data.userId, data.expiresAt, data.createdAt)
  }

  /**
   * Validate business invariants
   *
   * These are the BUSINESS RULES that must always be true
   */
  private validateInvariants(): void {
    // Token must not be empty
    if (!this.token || this.token.trim().length === 0) {
      throw new ValidationError('Refresh token cannot be empty', 'token')
    }

    // User ID must not be empty
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty', 'userId')
    }

    // Expiration date must be in the future (when creating)
    // Note: We allow expired tokens to exist for historical purposes
    // The isExpired() method will handle runtime expiration checks
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
