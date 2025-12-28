import type { IEnvironment } from '@domain/config/IEnvironment.js'
import { RefreshToken } from '@features/auth/domain/models/refresh-token/index.js'
import type { Result, UserEmail, UserRole, ValidationError } from '@team-pulse/shared'
import { AuthenticationError, Err, Ok, RefreshTokenId, type UserId } from '@team-pulse/shared'
import jwt from 'jsonwebtoken'
import {
  type AccessTokenPayload,
  AccessTokenPayloadSchema,
  type RefreshTokenPayload,
  RefreshTokenPayloadSchema,
} from './TokenFactory.schemas.js'

/**
 * Token Factory
 * Application Service for unified secure token operations.
 *
 * Payload types are defined in TokenFactory.schemas.ts and inferred from Zod schemas.
 * This ensures type safety and validation consistency.
 */

// Re-export payload types for convenience
export type { AccessTokenPayload, RefreshTokenPayload }

const ACCESS_TOKEN_EXPIRATION = '15m'
const REFRESH_TOKEN_EXPIRATION = '7d'

const JWT_ERROR_TYPES: Record<string, string> = {
  JsonWebTokenError: 'Invalid token',
  NotBeforeError: 'Token not yet valid',
  TokenExpiredError: 'Token has expired',
}

export class TokenFactory {
  // ============================================
  // STATIC METHODS
  // ============================================

  protected static handleJwtError({ error, field }: { error: unknown; field: string }): AuthenticationError {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage = JWT_ERROR_TYPES[errorName] || 'Invalid token'

    return AuthenticationError.create({ message: errorMessage, metadata: { field, originalError: errorName } })
  }

  static getRefreshTokenExpirationDate(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    return expiresAt
  }

  // ============================================
  // INSTANCE METHODS
  // ============================================

  private readonly env: IEnvironment

  private constructor({ env }: { env: IEnvironment }) {
    this.env = env
  }

  static create({ env }: { env: IEnvironment }): TokenFactory {
    return new TokenFactory({ env })
  }

  /**
   * Create a new refresh token
   * Includes strict typing ensuring UserId and RefreshTokenId don't mix up.
   */
  createRefreshToken({ userId }: { userId: UserId }): Result<RefreshToken, ValidationError> {
    // 1. Generate strictly typed ID
    const tokenId = RefreshTokenId.random()
    const expiresAt = TokenFactory.getRefreshTokenExpirationDate()

    // 2. Prepare payload (TypeScript ensures userId is UserId type)
    // NOTE: 'jsonwebtoken' will serialize these branded strings as normal strings.
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp' | 'aud' | 'iss'> = { tokenId, userId }

    // 3. Sign
    const jwtString = jwt.sign(payload, this.env.JWT_REFRESH_SECRET, {
      audience: 'team-pulse-app',
      expiresIn: REFRESH_TOKEN_EXPIRATION,
      issuer: 'team-pulse-api',
    })

    // 4. Create entity
    return RefreshToken.create({ expiresAt, id: tokenId, token: jwtString, userId })
  }

  /**
   * Create a new access token
   */
  createAccessToken({
    email,
    role,
    userId,
  }: {
    email: UserEmail
    role: UserRole
    userId: UserId
  }): Result<string, AuthenticationError> {
    try {
      // Prepare strict payload
      const payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'aud' | 'iss'> = {
        email: email.getValue(),
        role: role.getValue(),
        userId,
      }

      const token = jwt.sign(payload, this.env.JWT_SECRET, {
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
   * Uses Zod schema to validate and transform JWT payload
   */
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
    try {
      // 1. Verify JWT signature and get decoded payload
      const decoded = jwt.verify(token, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      })

      // 2. Safety check: jwt.verify can return string if payload is not JSON
      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // 3. Validate and transform payload using Zod schema
      // This validates email format, role enum, and transforms userId string → UserId branded type
      const validation = AccessTokenPayloadSchema.safeParse(decoded)

      if (!validation.success) {
        throw new Error(`Invalid token payload: ${validation.error.message}`)
      }

      return Ok(validation.data)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify a refresh token
   * Uses Zod schema to validate and transform JWT payload
   */
  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, AuthenticationError> {
    try {
      // 1. Verify JWT signature and get decoded payload
      const decoded = jwt.verify(token, this.env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      })

      // 2. Safety check: jwt.verify can return string if payload is not JSON
      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // 3. Validate and transform payload using Zod schema
      // This validates UUID formats and transforms tokenId/userId strings → branded types
      const validation = RefreshTokenPayloadSchema.safeParse(decoded)

      if (!validation.success) {
        throw new Error(`Invalid token payload: ${validation.error.message}`)
      }

      return Ok(validation.data)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
  }
}
