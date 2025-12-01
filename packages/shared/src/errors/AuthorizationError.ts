/**
 * AuthorizationError - Represents authorization failures (403 Forbidden)
 *
 * Used when user is authenticated but lacks required permissions
 *
 * @module errors/AuthorizationError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class AuthorizationError extends ApplicationError {
  readonly code = ERROR_CODES.AUTHORIZATION_ERROR
  readonly category = ERROR_CATEGORY.AUTHORIZATION

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
      isOperational: true,
      message,
      metadata,
      severity,
    })
  }

  /**
   * Create a generic authorization error
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): AuthorizationError {
    return new AuthorizationError({ message, metadata })
  }

  /**
   * Create an error for insufficient permissions
   */
  static insufficientPermissions({ required, actual }: { required: string | string[]; actual?: string }): AuthorizationError {
    const requiredPermissions = Array.isArray(required) ? required : [required]

    return new AuthorizationError({
      message: 'Insufficient permissions to perform this action',
      metadata: {
        actual,
        required: requiredPermissions,
      },
    })
  }
}
