import { ApplicationError } from './core'

/**
 * Not Found Error
 *
 * Used when a requested resource doesn't exist.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - User ID not found
 * - Team not found
 * - Route not found
 *
 * HTTP Status: 404 Not Found
 */

export class NotFoundError extends ApplicationError {
  static readonly CODE = 'NOT_FOUND' as const
  static readonly CATEGORY = 'not_found' as const

  readonly code = NotFoundError.CODE
  readonly category = NotFoundError.CATEGORY

  private constructor({
    entityName,
    identifier,
    message,
  }: {
    entityName: string
    identifier?: string | number
    message?: string
  }) {
    const defaultMessage = identifier ? `${entityName} with identifier "${identifier}" not found` : `${entityName} not found`

    super({
      message: message || defaultMessage,
      severity: 'low',
      metadata: { entityName, identifier },
      isOperational: true,
    })
  }

  /**
   * Create not found error
   */
  static create({ entityName, identifier }: { entityName: string; identifier?: string | number }): NotFoundError {
    return new NotFoundError({ entityName, identifier })
  }

  /**
   * Generic not found with custom message
   */
  static withMessage({ message }: { message: string }): NotFoundError {
    return new NotFoundError({ entityName: 'Resource', message })
  }
}
