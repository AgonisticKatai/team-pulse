import { ApplicationError } from './core'

/**
 * Internal Error
 *
 * Used for unexpected system errors and programming bugs.
 * This is NOT an operational error - details should be hidden from users.
 *
 * Examples:
 * - Null pointer exception
 * - Database connection failure
 * - Unhandled edge case
 * - Configuration error
 *
 * HTTP Status: 500 Internal Server Error
 */

export class InternalError extends ApplicationError {
  static readonly CODE = 'INTERNAL_ERROR' as const
  static readonly CATEGORY = 'internal' as const

  readonly code = InternalError.CODE
  readonly category = InternalError.CATEGORY

  private constructor({ message, cause }: { message?: string; cause?: Error }) {
    super({
      message: message || 'An unexpected error occurred',
      severity: 'critical',
      metadata: {},
      isOperational: false, // NOT operational - this is a bug!
      cause,
    })
  }

  /**
   * Create internal error
   */
  static create({ message, cause }: { message?: string; cause?: Error }): InternalError {
    return new InternalError({ message, cause })
  }

  /**
   * Wrap unknown error as internal error
   */
  static fromUnknown({ error }: { error: unknown }): InternalError {
    if (error instanceof Error) {
      return new InternalError({
        message: error.message,
        cause: error,
      })
    }

    return new InternalError({
      message: String(error),
    })
  }
}
