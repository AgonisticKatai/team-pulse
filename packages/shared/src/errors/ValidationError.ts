/**
 * ValidationError - Represents validation failures (400 Bad Request)
 *
 * Used when input data fails validation rules (missing fields, invalid formats, etc.)
 *
 * @module errors/ValidationError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class ValidationError extends ApplicationError {
  readonly code = ERROR_CODES.VALIDATION_ERROR
  readonly category = ERROR_CATEGORY.VALIDATION

  private constructor({
    message,
    severity = ERROR_SEVERITY.LOW,
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
   * Create a generic validation error
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): ValidationError {
    return new ValidationError({ message, metadata })
  }

  /**
   * Create a validation error for a specific field
   */
  static forField({ field, message }: { field: string; message: string }): ValidationError {
    return new ValidationError({
      message,
      metadata: { field },
    })
  }

  /**
   * Create a validation error from Zod validation error
   */
  static fromZodError({ error }: { error: { errors: Array<{ path: (string | number)[]; message: string }> } }): ValidationError {
    const firstError = error.errors[0]
    const field = firstError?.path.join('.') || 'unknown'
    const message = firstError?.message || 'Validation failed'

    return new ValidationError({
      message,
      metadata: {
        errors: error.errors,
        field,
      },
    })
  }

  /**
   * Create a validation error for an invalid value (useful for Value Objects)
   */
  static invalidValue({ field, value, message }: { field: string; value: unknown; message: string }): ValidationError {
    return new ValidationError({
      message,
      metadata: { field, value },
    })
  }
}
