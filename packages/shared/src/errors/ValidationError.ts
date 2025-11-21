import { ApplicationError } from './core'

/**
 * Validation Error
 *
 * Used when input data fails validation rules.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Invalid email format
 * - Required field missing
 * - Value out of range
 * - String too long/short
 *
 * HTTP Status: 400 Bad Request
 */

export class ValidationError extends ApplicationError {
  static readonly CODE = 'VALIDATION_ERROR' as const
  static readonly CATEGORY = 'validation' as const

  readonly code = ValidationError.CODE
  readonly category = ValidationError.CATEGORY

  private constructor({
    message,
    field,
    value,
    constraints,
  }: {
    message: string
    field?: string
    value?: unknown
    constraints?: Record<string, unknown>
  }) {
    super({
      message,
      severity: 'low',
      metadata: { field, value, constraints },
      isOperational: true,
    })
  }

  /**
   * Create a generic validation error
   */
  static create({ message, field, details }: { message: string; field?: string; details?: Record<string, unknown> }): ValidationError {
    return new ValidationError({ message, field, constraints: details })
  }

  /**
   * Create validation error for a specific field
   */
  static forField({ field, message }: { field: string; message: string }): ValidationError {
    return new ValidationError({ message, field })
  }

  /**
   * Create from Zod validation error
   */
  static fromZodError(error: { errors: Array<{ path: (string | number)[]; message: string }> }): ValidationError {
    const firstError = error.errors[0]
    const field = firstError?.path.join('.') || 'unknown'
    const message = firstError?.message || 'Validation failed'

    return new ValidationError({
      message,
      field,
      constraints: { errors: error.errors },
    })
  }
}
