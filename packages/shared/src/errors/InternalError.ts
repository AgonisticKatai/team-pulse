/**
 * InternalError - Represents internal server errors (500 Internal Server Error)
 *
 * Used for unexpected errors that shouldn't be exposed to clients
 * Note: These are NOT operational errors - details should be hidden from users
 *
 * @module errors/InternalError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class InternalError extends ApplicationError {
  readonly code = ERROR_CODES.INTERNAL_ERROR
  readonly category = ERROR_CATEGORY.INTERNAL

  private constructor({
    message,
    severity = ERROR_SEVERITY.CRITICAL,
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
      isOperational: false, // NOT operational - should be hidden from users
    })
  }

  /**
   * Create an internal error
   *
   * Note: These errors should not expose internal details to users
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): InternalError {
    return new InternalError({ message, metadata })
  }

  /**
   * Create an internal error from an unexpected exception
   */
  static fromError({ error, context }: { error: Error; context?: string }): InternalError {
    return new InternalError({
      message: context ? `Internal error: ${context}` : 'Internal server error',
      metadata: {
        originalMessage: error.message,
        stack: error.stack,
        ...(context && { context }),
      },
    })
  }
}
