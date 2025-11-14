import { DomainError } from './DomainError.js'

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

  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }

  /**
   * Create validation error for a specific field
   * TODO (Tech Debt): ValidationError should follow our architectural patterns:
   * - Private constructor
   * - Named parameters in constructor
   * - Static create() method with Result<T, E> pattern
   * - This will be addressed when migrating error classes
   */
  static forField({ field, message }: { field: string; message: string }): ValidationError {
    return new ValidationError(message, field)
  }

  /**
   * Create from Zod validation error
   */
  static fromZodError(error: { errors: Array<{ path: string[]; message: string }> }): ValidationError {
    const firstError = error.errors[0]
    const field = firstError?.path.join('.') || 'unknown'
    const message = firstError?.message || 'Validation failed'

    return new ValidationError(message, field, {
      errors: error.errors,
    })
  }
}
