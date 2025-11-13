import type { UserRole } from '@team-pulse/shared'
import jwt from 'jsonwebtoken'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import { Err, Ok, type Result } from '../../domain/types/Result.js'
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
  email: string
  role: UserRole
  userId: string
}

/**
 * Payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
  tokenId: string // Unique ID for this refresh token (for revocation)
  userId: string
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

/** Mapping of JWT error types to messages */
const JWT_ERROR_TYPES: Record<string, string> = {
  JsonWebTokenError: 'Invalid token',
  TokenExpiredError: 'Token has expired',
}

/**
 * Generate an access token
 *
 * @param env - Environment configuration containing JWT_SECRET
 * @param payload - The token payload
 * @returns The signed JWT token
 */
export function generateAccessToken({
  env,
  payload,
}: {
  env: Env
  payload: AccessTokenPayload
}): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    audience: 'team-pulse-app',
    expiresIn: ACCESS_TOKEN_EXPIRATION,
    issuer: 'team-pulse-api',
  })
}

/**
 * Generate a refresh token
 *
 * @param env - Environment configuration containing JWT_REFRESH_SECRET
 * @param payload - The token payload
 * @returns The signed JWT token
 */
export function generateRefreshToken({
  env,
  payload,
}: {
  env: Env
  payload: RefreshTokenPayload
}): string {
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
 * @returns The decoded payload
 * @throws Error if the token is invalid or expired
 */
export function verifyAccessToken({ env, token }: { env: Env; token: string }): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      audience: 'team-pulse-app',
      issuer: 'team-pulse-api',
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
export function verifyRefreshToken({
  env,
  token,
}: {
  env: Env
  token: string
}): Result<RefreshTokenPayload, ValidationError> {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      audience: 'team-pulse-app',
      issuer: 'team-pulse-api',
    }) as RefreshTokenPayload

    return Ok(payload)
  } catch (error) {
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage = JWT_ERROR_TYPES[errorName]

    return Err(
      ValidationError.forField({
        field: 'refreshToken',
        message: errorMessage || 'Invalid refresh token',
      }),
    )
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
