import { DomainError } from './DomainError'

/**
 * Validation error for domain entity validation failures
 */
export class ValidationError extends DomainError {
  public readonly field?: string
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    options?: {
      field?: string
      details?: Record<string, unknown>
    },
  ) {
    super(message, { isOperational: true })
    this.field = options?.field
    this.details = options?.details
  }

  /**
   * Factory method for field-specific validation errors
   */
  static forField(field: string, message: string): ValidationError {
    return new ValidationError(message, { field })
  }

  /**
   * Factory method for multiple validation errors
   */
  static withDetails(message: string, details: Record<string, unknown>): ValidationError {
    return new ValidationError(message, { details })
  }

  override toObject() {
    return {
      ...super.toObject(),
      details: this.details,
      field: this.field,
    }
  }
}
