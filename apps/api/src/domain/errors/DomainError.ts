import { ERROR_CATEGORY, ERROR_SEVERITY, type ErrorCategory, type ErrorSeverity, type IApplicationError } from '@team-pulse/shared/errors'

/**
 * Base class for all domain errors
 *
 * Domain errors represent business rule violations or exceptional
 * situations in the domain layer. Implements IApplicationError to be
 * compatible with the shared error handling system.
 *
 * Default values (safe for business logic errors):
 * - category: ERROR_CATEGORY.VALIDATION (400 Bad Request)
 * - severity: ERROR_SEVERITY.LOW (not critical)
 * - isOperational: true (safe to expose to users)
 *
 * Subclasses can override category and severity as needed.
 */
export abstract class DomainError extends Error implements IApplicationError {
  /**
   * Error code for identification and logging
   * Format: DOMAIN_SPECIFIC_ERROR (e.g., TEAM_NOT_FOUND, INVALID_TEAM_NAME)
   */
  abstract readonly code: string

  /**
   * Semantic category for error classification and HTTP mapping
   * Default: ERROR_CATEGORY.VALIDATION (400 Bad Request)
   * Override in subclasses as needed (e.g., ERROR_CATEGORY.INTERNAL for RepositoryError)
   */
  readonly category: ErrorCategory = ERROR_CATEGORY.VALIDATION

  /**
   * Severity level for logging and monitoring
   * Default: ERROR_SEVERITY.LOW (not critical)
   * Override in subclasses as needed (e.g., ERROR_SEVERITY.HIGH for RepositoryError)
   */
  readonly severity: ErrorSeverity = ERROR_SEVERITY.LOW

  /**
   * Timestamp when the error was created
   */
  readonly timestamp: Date

  /**
   * Additional contextual information about the error
   */
  readonly metadata?: Record<string, unknown>

  /**
   * Whether this error should be shown to end users
   * false = internal error, show generic message
   * true = safe to expose details to user
   */
  abstract readonly isOperational: boolean

  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.metadata = metadata
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Serialize error to JSON format
   * Useful for logging, API responses, and debugging
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      isOperational: this.isOperational,
      stack: this.stack,
    }
  }
}
