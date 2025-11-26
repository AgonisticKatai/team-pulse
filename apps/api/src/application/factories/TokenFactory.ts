import { randomUUID } from 'node:crypto'
import type { IEnvironment } from '@domain/config/IEnvironment.js'
import type { ValidationError } from '@domain/errors/ValidationError.js'
import { RefreshToken } from '@domain/models/RefreshToken.js'
import { AuthenticationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import type { UserRole } from '@team-pulse/shared/types'
import jwt from 'jsonwebtoken'

/**
 * Token Factory
 *
 * This is an APPLICATION LAYER FACTORY that provides a unified API for all token operations.
 *
 * Architecture:
 * - Application Layer (this factory)
 *   ├─> Domain Layer (RefreshToken entity)
 *   └─> Infrastructure Layer (jwt library)
 *
 * Responsibilities:
 * 1. LOW-LEVEL: Generate and verify JWT tokens (static methods)
 * 2. HIGH-LEVEL: Coordinate token creation with domain entities (instance methods)
 *
 * This design:
 * - Encapsulates ALL token logic in one place
 * - Respects hexagonal architecture (domain stays pure)
 * - Provides both low-level primitives and high-level coordination
 * - Enables easy testing and mocking
 */

/**
 * Payload structure for access tokens
 */
export interface AccessTokenPayload {
  email: string
  role: UserRole
  userId: string
}

/**
 * Payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
  tokenId: string
  userId: string
}

/**
 * Access token expiration time (15 minutes)
 */
const ACCESS_TOKEN_EXPIRATION = '15m'

/**
 * Refresh token expiration time (7 days)
 */
const REFRESH_TOKEN_EXPIRATION = '7d'

/**
 * Mapping of JWT error types to user-friendly messages
 */
const JWT_ERROR_TYPES: Record<string, string> = {
  JsonWebTokenError: 'Invalid token',
  NotBeforeError: 'Token not yet valid',
  TokenExpiredError: 'Token has expired',
}

export class TokenFactory {
  // ============================================
  // STATIC METHODS (Low-level JWT operations)
  // Can be used independently without creating an instance
  // ============================================

  /**
   * Handle JWT errors and convert to AuthenticationError
   */
  protected static handleJwtError({ error, field }: { error: unknown; field: string }): AuthenticationError {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage = JWT_ERROR_TYPES[errorName] || 'Invalid token'

    return AuthenticationError.create({
      message: errorMessage,
      metadata: {
        field,
        originalError: errorName,
      },
    })
  }

  /**
   * Get the expiration date for a refresh token
   *
   * @returns Date object representing when the refresh token will expire (7 days from now)
   */
  static getRefreshTokenExpirationDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return expiresAt
  }

  // ============================================
  // INSTANCE METHODS
  // All token operations require an instance with env injected
  // ============================================

  private readonly env: IEnvironment

  private constructor({ env }: { env: IEnvironment }) {
    this.env = env
  }

  /**
   * Factory method to create TokenFactory instance
   *
   * @param env - Environment configuration
   * @returns TokenFactory instance
   */
  static create({ env }: { env: IEnvironment }): TokenFactory {
    return new TokenFactory({ env })
  }

  /**
   * Create a new refresh token
   *
   * High-level method that coordinates:
   * 1. Generating a unique token ID
   * 2. Calculating expiration date
   * 3. Generating JWT string (infrastructure)
   * 4. Creating RefreshToken entity (domain)
   *
   * @param userId - The user ID to associate with the token
   * @returns Result with RefreshToken entity or ValidationError
   */
  createRefreshToken({ userId }: { userId: string }): Result<RefreshToken, ValidationError> {
    const tokenId = randomUUID()
    const expiresAt = TokenFactory.getRefreshTokenExpirationDate()

    // Generate JWT string (infrastructure concern)
    const jwtString = jwt.sign({ tokenId, userId }, this.env.JWT_REFRESH_SECRET, {
      audience: 'team-pulse-app',
      expiresIn: REFRESH_TOKEN_EXPIRATION,
      issuer: 'team-pulse-api',
    })

    // Create domain entity (domain concern)
    return RefreshToken.create({
      expiresAt,
      id: tokenId,
      token: jwtString,
      userId,
    })
  }

  /**
   * Create a new access token
   *
   * High-level method that generates a JWT access token with the user's claims.
   * Access tokens are stateless and not persisted.
   *
   * @param email - User's email
   * @param role - User's role
   * @param userId - User's ID
   * @returns Result with JWT string or AuthenticationError
   */
  createAccessToken({ email, role, userId }: { email: string; role: UserRole; userId: string }): Result<string, AuthenticationError> {
    try {
      const token = jwt.sign({ email, role, userId }, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        expiresIn: ACCESS_TOKEN_EXPIRATION,
        issuer: 'team-pulse-api',
      })
      return Ok(token)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify an access token
   *
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or AuthenticationError
   */
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
    try {
      const payload = jwt.verify(token, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      }) as AccessTokenPayload

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify a refresh token
   *
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or AuthenticationError
   */
  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, AuthenticationError> {
    try {
      const payload = jwt.verify(token, this.env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      }) as RefreshTokenPayload

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
  }
}
