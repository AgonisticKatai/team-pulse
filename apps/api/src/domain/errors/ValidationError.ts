import { DomainError } from '@domain/errors/DomainError.js'

/**
 * Validation Error
 *
 * Thrown when input data fails validation rules.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Team name is too short
 * - Invalid email format
 * - Missing required fields
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR'
  readonly isOperational = true

  public readonly field?: string
  public readonly details?: Record<string, unknown>

  private constructor({ message, field, details }: { message: string; field?: string; details?: Record<string, unknown> }) {
    super(message, {
      field,
      details,
    })
    this.field = field
    this.details = details
  }

  /**
   * Factory method to create a generic validation error
   */
  static create({ message, field, details }: { message: string; field?: string; details?: Record<string, unknown> }): ValidationError {
    return new ValidationError({ details, field, message })
  }

  /**
   * Create validation error for a specific field
   */
  static forField({ field, message }: { field: string; message: string }): ValidationError {
    return new ValidationError({ field, message })
  }

  /**
   * Create from Zod validation error
   */
  static fromZodError(error: { errors: Array<{ path: string[]; message: string }> }): ValidationError {
    const firstError = error.errors[0]
    const field = firstError?.path.join('.') || 'unknown'
    const message = firstError?.message || 'Validation failed'

    return new ValidationError({ details: { errors: error.errors }, field, message })
  }
}
