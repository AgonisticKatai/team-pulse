/**
 * AuthenticationError - Represents authentication failures (401 Unauthorized)
 *
 * Used when authentication is required but missing or invalid
 *
 * @module errors/AuthenticationError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class AuthenticationError extends ApplicationError {
  readonly code = ERROR_CODES.AUTHENTICATION_ERROR
  readonly category = ERROR_CATEGORY.AUTHENTICATION

  private constructor({
    message,
    severity = ERROR_SEVERITY.MEDIUM,
    metadata,
  }: {
    message: string
    severity?: ErrorSeverity
    metadata?: Record<string, unknown>
  }) {
    super({
      message,
      severity,
      metadata,
      isOperational: true,
    })
  }

  /**
   * Create a generic authentication error
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): AuthenticationError {
    return new AuthenticationError({ message, metadata })
  }

  /**
   * Create an error for invalid credentials
   */
  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError({
      message: 'Invalid credentials',
      metadata: { reason: 'invalid_credentials' },
    })
  }

  /**
   * Create an error for invalid token
   */
  static invalidToken({ reason }: { reason?: string } = {}): AuthenticationError {
    return new AuthenticationError({
      message: 'Invalid or expired token',
      metadata: { reason: reason || 'invalid_token' },
    })
  }

  /**
   * Create an error for missing token
   */
  static missingToken(): AuthenticationError {
    return new AuthenticationError({
      message: 'Authentication token is required',
      metadata: { reason: 'missing_token' },
    })
  }
}
