import type { LoginResponseDTO } from '@team-pulse/shared'
import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import { Token } from '../value-objects'
import type {
  CreateSessionData,
  SessionConstructorProps,
  SessionData,
  SessionValueObjectsProps,
  UpdateAccessTokenData,
  UpdateTokensData,
  ValidateSessionData,
} from './Session.types'
import { User } from './User'

// Re-export public types
export type { CreateSessionData, SessionData, SessionValueObjectsProps, UpdateAccessTokenData, UpdateTokensData }

/**
 * Session Entity
 * Represents an authenticated user session with tokens
 */
export class Session {
  private readonly user: User
  private readonly accessToken: Token
  private readonly refreshToken: Token
  private readonly createdAt: Date

  private constructor(props: SessionConstructorProps) {
    this.accessToken = props.accessToken
    this.createdAt = props.createdAt
    this.refreshToken = props.refreshToken
    this.user = props.user
  }

  /**
   * Factory method to create a Session from domain primitives
   * Returns [error, null] or [null, session]
   */
  static create(data: CreateSessionData): Result<Session, ValidationError> {
    // Validate first
    const error = Session.validate(data)
    if (error) return Err(error)

    // Create tokens (we know they're valid now)
    const [, accessToken] = Token.create({ value: data.accessToken })
    const [, refreshToken] = Token.create({ value: data.refreshToken })

    return Ok(
      new Session({
        accessToken: accessToken!,
        createdAt: data.createdAt,
        refreshToken: refreshToken!,
        user: data.user,
      }),
    )
  }

  /**
   * Validate Session data
   * Returns error if validation fails, null if valid
   */
  private static validate(data: ValidateSessionData): ValidationError | null {
    // Validate access token
    const [accessError] = Token.create({ value: data.accessToken })
    if (accessError) return accessError

    // Validate refresh token
    const [refreshError] = Token.create({ value: data.refreshToken })
    if (refreshError) return refreshError

    // Validate createdAt
    if (!(data.createdAt instanceof Date) || Number.isNaN(data.createdAt.getTime())) {
      return ValidationError.forField('createdAt', 'Invalid date')
    }

    return null
  }

  /**
   * Factory method to create a Session from Token Value Objects
   * Returns [error, null] or [null, session]
   */
  static fromValueObjects(props: SessionValueObjectsProps): Result<Session, ValidationError> {
    return Session.create({
      accessToken: props.accessToken.getValue(),
      createdAt: new Date(),
      refreshToken: props.refreshToken.getValue(),
      user: props.user,
    })
  }

  /**
   * Factory method to create a Session from LoginResponseDTO
   * Returns [error, null] or [null, session]
   */
  static fromDTO(dto: LoginResponseDTO): Result<Session, ValidationError> {
    // Map user DTO to domain
    const [userError, user] = User.fromDTO(dto.user)
    if (userError) {
      return Err(
        new ValidationError(`Failed to create Session from DTO: ${userError.message}`, {
          details: { dto, originalError: userError.toObject() },
        }),
      )
    }

    // Create session
    const [sessionError, session] = Session.create({
      accessToken: dto.accessToken,
      createdAt: new Date(),
      refreshToken: dto.refreshToken,
      user,
    })

    if (sessionError) {
      return Err(
        new ValidationError(`Failed to create Session from DTO: ${sessionError.message}`, {
          details: { dto, originalError: sessionError.toObject() },
        }),
      )
    }

    return Ok(session)
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
  updateAccessToken(data: UpdateAccessTokenData): Result<Session, ValidationError> {
    return Session.create({
      accessToken: data.newAccessToken,
      createdAt: this.createdAt,
      refreshToken: this.refreshToken.getValue(),
      user: this.user,
    })
  }

  /**
   * Update session with new tokens (after full refresh)
   * Returns new Session instance (immutability)
   */
  updateTokens(data: UpdateTokensData): Result<Session, ValidationError> {
    return Session.create({
      accessToken: data.newAccessToken,
      createdAt: this.createdAt,
      refreshToken: data.newRefreshToken,
      user: this.user,
    })
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
   * Matches the create() signature for symmetry
   */
  toObject(): SessionData {
    return {
      accessToken: this.accessToken.getValue(),
      createdAt: this.createdAt,
      refreshToken: this.refreshToken.getValue(),
      user: this.user,
    }
  }

  /**
   * Convert to DTO (for storage/API communication)
   */
  toDTO(): LoginResponseDTO {
    return {
      accessToken: this.accessToken.getValue(),
      refreshToken: this.refreshToken.getValue(),
      user: this.user.toDTO(),
    }
  }

  /**
   * JSON serialization
   */
  toJSON() {
    return this.toObject()
  }
}
