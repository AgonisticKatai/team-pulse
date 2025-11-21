import { ApplicationError } from './core'

/**
 * Conflict Error
 *
 * Used when a resource already exists or state conflict occurs.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Email already registered
 * - Duplicate team name
 * - Concurrent modification conflict
 *
 * HTTP Status: 409 Conflict
 */

export class ConflictError extends ApplicationError {
  static readonly CODE = 'CONFLICT' as const
  static readonly CATEGORY = 'conflict' as const

  readonly code = ConflictError.CODE
  readonly category = ConflictError.CATEGORY

  private constructor({
    entityName,
    identifier,
    message,
  }: {
    entityName: string
    identifier?: string | number
    message?: string
  }) {
    const defaultMessage = identifier ? `${entityName} with identifier "${identifier}" already exists` : `${entityName} already exists`

    super({
      message: message || defaultMessage,
      severity: 'low',
      metadata: { entityName, identifier },
      isOperational: true,
    })
  }

  /**
   * Create conflict error
   */
  static create({ entityName, identifier }: { entityName: string; identifier?: string | number }): ConflictError {
    return new ConflictError({ entityName, identifier })
  }

  /**
   * Generic conflict with custom message
   */
  static withMessage({ message }: { message: string }): ConflictError {
    return new ConflictError({ entityName: 'Resource', message })
  }
}
