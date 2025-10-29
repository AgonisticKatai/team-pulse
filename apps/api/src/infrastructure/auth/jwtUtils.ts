import type { UserRole } from '@team-pulse/shared'
import jwt from 'jsonwebtoken'
import type { Env } from '../config/env.js'

/**
 * JWT token utilities
 *
 * Provides functions to generate and verify JWT tokens for authentication.
 * Uses two types of tokens:
 * - Access tokens: Short-lived (15 minutes), used for API requests
 * - Refresh tokens: Long-lived (7 days), used to obtain new access tokens
 */

/**
 * Payload structure for access tokens
 */
export interface AccessTokenPayload {
  userId: string
  email: string
  role: UserRole
}

/**
 * Payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
  userId: string
  tokenId: string // Unique ID for this refresh token (for revocation)
}

/**
 * Access token expiration time
 * 15 minutes for security
 */
const ACCESS_TOKEN_EXPIRATION = '15m'

/**
 * Refresh token expiration time
 * 7 days for user convenience
 */
const REFRESH_TOKEN_EXPIRATION = '7d'

/**
 * Generate an access token
 *
 * @param payload - The token payload
 * @param env - Environment configuration containing JWT_SECRET
 * @returns The signed JWT token
 */
export function generateAccessToken(payload: AccessTokenPayload, env: Env): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
    issuer: 'team-pulse-api',
    audience: 'team-pulse-app',
  })
}

/**
 * Generate a refresh token
 *
 * @param payload - The token payload
 * @param env - Environment configuration containing JWT_REFRESH_SECRET
 * @returns The signed JWT token
 */
export function generateRefreshToken(payload: RefreshTokenPayload, env: Env): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
    issuer: 'team-pulse-api',
    audience: 'team-pulse-app',
  })
}

/**
 * Verify and decode an access token
 *
 * @param token - The JWT token to verify
 * @param env - Environment configuration containing JWT_SECRET
 * @returns The decoded payload
 * @throws Error if the token is invalid or expired
 */
export function verifyAccessToken(token: string, env: Env): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'team-pulse-api',
      audience: 'team-pulse-app',
    }) as AccessTokenPayload

    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token')
    }
    throw error
  }
}

/**
 * Verify and decode a refresh token
 *
 * @param token - The JWT token to verify
 * @param env - Environment configuration containing JWT_REFRESH_SECRET
 * @returns The decoded payload
 * @throws Error if the token is invalid or expired
 */
export function verifyRefreshToken(token: string, env: Env): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'team-pulse-api',
      audience: 'team-pulse-app',
    }) as RefreshTokenPayload

    return payload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    }
    throw error
  }
}

/**
 * Get the expiration date for a refresh token
 *
 * @returns Date object representing when the refresh token will expire
 */
export function getRefreshTokenExpirationDate(): Date {
  // 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt
}
