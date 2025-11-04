import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import type { User } from './User'

/**
 * Token Value Object for JWT tokens
 */
class Token {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<Token, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('token', 'Token is required'))
    }

    const trimmedValue = value.trim()

    // Basic JWT format validation (3 parts separated by dots)
    const parts = trimmedValue.split('.')
    if (parts.length !== 3) {
      return Err(ValidationError.forField('token', 'Invalid token format'))
    }

    return Ok(new Token(trimmedValue))
  }

  getValue(): string {
    return this.value
  }

  equals(other: Token): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

/**
 * Session properties for creation
 */
export interface SessionProps {
  accessToken: Token
  refreshToken: Token
  user: User
}

/**
 * Session Entity
 * Represents an authenticated user session with tokens
 */
export class Session {
  private constructor(
    private readonly user: User,
    private readonly accessToken: Token,
    private readonly refreshToken: Token,
    private readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a Session from domain primitives
   * Returns [error, null] or [null, session]
   */
  static create(data: {
    accessToken: string
    refreshToken: string
    user: User
  }): Result<Session, ValidationError> {
    // Validate and create access token
    const [accessError, accessToken] = Token.create(data.accessToken)
    if (accessError) return Err(accessError)

    // Validate and create refresh token
    const [refreshError, refreshToken] = Token.create(data.refreshToken)
    if (refreshError) return Err(refreshError)

    return Ok(new Session(data.user, accessToken, refreshToken, new Date()))
  }

  /**
   * Factory method to create a Session from Token Value Objects
   */
  static fromValueObjects(props: SessionProps): Session {
    return new Session(props.user, props.accessToken, props.refreshToken, new Date())
  }

  /**
   * Create empty session (for initial/logged out state)
   * Returns null to represent "no session"
   */
  static empty(): null {
    return null
  }

  /**
   * Update session with new access token (after refresh)
   * Returns new Session instance (immutability)
   */
  updateAccessToken(newAccessToken: string): Result<Session, ValidationError> {
    const [error, token] = Token.create(newAccessToken)
    if (error) return Err(error)

    return Ok(new Session(this.user, token, this.refreshToken, this.createdAt))
  }

  /**
   * Update session with new tokens (after full refresh)
   * Returns new Session instance (immutability)
   */
  updateTokens(newAccessToken: string, newRefreshToken: string): Result<Session, ValidationError> {
    const [accessError, accessToken] = Token.create(newAccessToken)
    if (accessError) return Err(accessError)

    const [refreshError, refreshToken] = Token.create(newRefreshToken)
    if (refreshError) return Err(refreshError)

    return Ok(new Session(this.user, accessToken, refreshToken, this.createdAt))
  }

  // Getters

  getUser(): User {
    return this.user
  }

  getAccessToken(): string {
    return this.accessToken.getValue()
  }

  getRefreshToken(): string {
    return this.refreshToken.getValue()
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  // Business logic methods

  /**
   * Check if session is authenticated
   */
  isAuthenticated(): boolean {
    return true // If session exists, it's authenticated
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    // Safe to cast as User.hasRole validates the role internally
    return this.user.getRole().getValue() === role
  }

  /**
   * Check if user is Super Admin
   */
  isSuperAdmin(): boolean {
    return this.user.isSuperAdmin()
  }

  /**
   * Check if user is Admin or higher
   */
  isAdmin(): boolean {
    return this.user.isAdmin()
  }

  /**
   * Get session age in milliseconds
   */
  getAgeInMs(): number {
    return Date.now() - this.createdAt.getTime()
  }

  /**
   * Get session age in minutes
   */
  getAgeInMinutes(): number {
    return Math.floor(this.getAgeInMs() / 1000 / 60)
  }

  /**
   * Convert to plain object (for serialization)
   */
  toObject(): {
    accessToken: string
    createdAt: string
    refreshToken: string
    user: ReturnType<User['toObject']>
  } {
    return {
      accessToken: this.accessToken.getValue(),
      createdAt: this.createdAt.toISOString(),
      refreshToken: this.refreshToken.getValue(),
      user: this.user.toObject(),
    }
  }

  /**
   * JSON serialization
   */
  toJSON() {
    return this.toObject()
  }
}
