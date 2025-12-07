import type { IEnvironment } from '@domain/config/IEnvironment.js'
import { RefreshToken } from '@domain/models/RefreshToken.js'
import type { RefreshTokenId, UserId } from '@team-pulse/shared/domain/ids'
import { IdUtils } from '@team-pulse/shared/domain/ids'
import type { Email, Role } from '@team-pulse/shared/domain/value-objects'
import type { ValidationError } from '@team-pulse/shared/errors'
import { AuthenticationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import jwt from 'jsonwebtoken'

/**
 * Token Factory
 * Application Service for unified secure token operations.
 */

// ==========================================
// 1. PAYLOADS (Strict Typing)
// ==========================================

/**
 * Payload structure for access tokens
 * USES BRANDED TYPES
 */
export interface AccessTokenPayload {
  email: string
  role: string
  userId: UserId
  iat?: number
  exp?: number
  aud?: string
  iss?: string
}

/**
 * Payload structure for refresh tokens
 * USES BRANDED TYPES
 */
export interface RefreshTokenPayload {
  tokenId: RefreshTokenId
  userId: UserId
  iat?: number
  exp?: number
  aud?: string
  iss?: string
}

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
    const tokenId = IdUtils.generate<RefreshTokenId>()
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
    email: Email
    role: Role
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
   * Hydrates strings back to Branded Types
   */
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
    try {
      // 1. Get the result (can be string or object)
      const decoded = jwt.verify(token, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      })

      // 2. SAFETY CHECK: jwt.verify can return string if the payload is not JSON.
      // This is improbable in your app, but TypeScript appreciates it.
      if (typeof decoded === 'string') throw new Error('Invalid token payload type (string)')

      // 3. CAST: Cast to 'unknown' instead of 'any'.
      // This tells the linter: "I don't know what this is, but I promise to check it before using it"
      const rawPayload = decoded as Record<string, unknown>

      // 4. HYDRATION: Map explicitly and ensure they are strings
      const payload: AccessTokenPayload = {
        aud: rawPayload['aud'] as string,
        email: rawPayload['email'] as string,
        exp: rawPayload['exp'] as number,
        // Standard claims (optional)
        iat: rawPayload['iat'] as number,
        iss: rawPayload['iss'] as string,
        role: rawPayload['role'] as string,
        userId: IdUtils.toId<UserId>(rawPayload['userId'] as string),
      }

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify a refresh token
   * Hydrates strings back to Branded Types
   */
  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, AuthenticationError> {
    try {
      // 1. Get the result (can be string or object)
      const decoded = jwt.verify(token, this.env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api',
      })

      // 2. SAFETY CHECK: jwt.verify can return string if the payload is not JSON.
      // This is improbable in your app, but TypeScript appreciates it.
      if (typeof decoded === 'string') throw new Error('Invalid token payload type (string)')

      // 3. CAST: Cast to 'unknown' instead of 'any'.
      // This tells the linter: "I don't know what this is, but I promise to check it before using it"
      const rawPayload = decoded as Record<string, unknown>

      // 4. HYDRATION: Map explicitly and ensure they are strings
      const payload: RefreshTokenPayload = {
        aud: rawPayload['aud'] as string,
        exp: rawPayload['exp'] as number,
        // Standard claims
        iat: rawPayload['iat'] as number,
        iss: rawPayload['iss'] as string,
        tokenId: IdUtils.toId<RefreshTokenId>(rawPayload['tokenId'] as string),
        userId: IdUtils.toId<UserId>(rawPayload['userId'] as string),
      }

      return Ok(payload)
    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
  }
}
