import { ApplicationError } from './core'

/**
 * Authentication Error
 *
 * Used when identity verification fails.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Invalid credentials (wrong password)
 * - Invalid or expired token
 * - Missing authentication token
 *
 * HTTP Status: 401 Unauthorized
 */

export class AuthenticationError extends ApplicationError {
  static readonly CODE = 'AUTHENTICATION_ERROR' as const
  static readonly CATEGORY = 'authentication' as const

  readonly code = AuthenticationError.CODE
  readonly category = AuthenticationError.CATEGORY

  private constructor({ message, details }: { message: string; details?: Record<string, unknown> }) {
    super({
      message,
      severity: 'medium',
      metadata: details,
      isOperational: true,
    })
  }

  /**
   * Generic authentication failure
   */
  static create({ message }: { message: string }): AuthenticationError {
    return new AuthenticationError({ message })
  }

  /**
   * Invalid username/password combination
   */
  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError({
      message: 'Invalid credentials',
      details: { reason: 'invalid_credentials' },
    })
  }

  /**
   * Invalid or expired JWT token
   */
  static invalidToken({ reason }: { reason?: string } = {}): AuthenticationError {
    return new AuthenticationError({
      message: 'Invalid or expired token',
      details: { reason: reason || 'invalid_token' },
    })
  }

  /**
   * Missing authentication token
   */
  static missingToken(): AuthenticationError {
    return new AuthenticationError({
      message: 'Missing authentication token',
      details: { reason: 'missing_token' },
    })
  }

  /**
   * Invalid refresh token
   */
  static invalidRefreshToken(): AuthenticationError {
    return new AuthenticationError({
      message: 'Invalid or expired refresh token',
      details: { reason: 'invalid_refresh_token' },
    })
  }
}
