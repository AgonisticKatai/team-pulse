import { randomUUID } from 'node:crypto'
import type { UserRole } from '@team-pulse/shared'
import jwt from 'jsonwebtoken'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import type { Env } from '../../infrastructure/config/env.js'

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
   * Handle JWT errors and convert to ValidationError
   */
  private static handleJwtError({ error, field }: { error: unknown; field: string }): ValidationError {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage = JWT_ERROR_TYPES[errorName]

    return ValidationError.forField({
      field,
      message: errorMessage || 'Invalid token',
    })
  }

  /**
   * Generate an access token JWT
   *
   * Low-level method to create an access token from payload.
   * Use instance method createAccessToken() for high-level coordination.
   *
   * @param env - Environment configuration containing JWT_SECRET
   * @param payload - The token payload
   * @returns Result with JWT string or ValidationError
   */
  static generateAccessToken({ env, payload }: { env: Env; payload: AccessTokenPayload }): Result<string, ValidationError> {
    try {
      const token = jwt.sign(payload, env.JWT_SECRET, {
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
   * Generate a refresh token JWT
   *
   * Low-level method to create a refresh token from payload.
   * Use instance method createRefreshToken() for high-level coordination.
   *
   * @param env - Environment configuration containing JWT_REFRESH_SECRET
   * @param payload - The token payload
   * @returns JWT string
   */
  static generateRefreshToken({ env, payload }: { env: Env; payload: RefreshTokenPayload }): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      audience: 'team-pulse-app',
      expiresIn: REFRESH_TOKEN_EXPIRATION,
      issuer: 'team-pulse-api',
    })
  }

  /**
   * Verify and decode an access token
   *
   * @param env - Environment configuration containing JWT_SECRET
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or ValidationError
   */
  static verifyAccessToken({ env, token }: { env: Env; token: string }): Result<AccessTokenPayload, ValidationError> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      }) as AccessTokenPayload

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify and decode a refresh token
   *
   * @param env - Environment configuration containing JWT_REFRESH_SECRET
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or ValidationError
   */
  static verifyRefreshToken({ env, token }: { env: Env; token: string }): Result<RefreshTokenPayload, ValidationError> {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      }) as RefreshTokenPayload

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
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
  // INSTANCE METHODS (High-level coordination)
  // Require an instance with env injected
  // ============================================

  private constructor(private readonly env: Env) {}

  /**
   * Factory method to create TokenFactory instance
   *
   * @param env - Environment configuration
   * @returns TokenFactory instance
   */
  static create({ env }: { env: Env }): TokenFactory {
    return new TokenFactory(env)
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
    const jwtString = TokenFactory.generateRefreshToken({
      env: this.env,
      payload: { tokenId, userId },
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
   * @returns Result with JWT string or ValidationError
   */
  createAccessToken({ email, role, userId }: { email: string; role: UserRole; userId: string }): Result<string, ValidationError> {
    return TokenFactory.generateAccessToken({
      env: this.env,
      payload: { email, role, userId },
    })
  }

  /**
   * Verify an access token
   *
   * Convenience instance method that uses the injected env.
   *
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or ValidationError
   */
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, ValidationError> {
    return TokenFactory.verifyAccessToken({ env: this.env, token })
  }

  /**
   * Verify a refresh token
   *
   * Convenience instance method that uses the injected env.
   *
   * @param token - The JWT token to verify
   * @returns Result with decoded payload or ValidationError
   */
  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, ValidationError> {
    return TokenFactory.verifyRefreshToken({ env: this.env, token })
  }
}
