/**
 * Base class for all domain errors
 *
 * Domain errors represent business rule violations or exceptional
 * situations in the domain layer. They are framework-agnostic and
 * should not depend on HTTP status codes or other infrastructure concerns.
 *
 * The infrastructure layer (HTTP handlers) is responsible for mapping
 * these errors to appropriate HTTP responses.
 */
export abstract class DomainError extends Error {
  /**
   * Error code for identification and logging
   * Format: DOMAIN_SPECIFIC_ERROR (e.g., TEAM_NOT_FOUND, INVALID_TEAM_NAME)
   */
  abstract readonly code: string

  /**
   * Whether this error should be shown to end users
   * false = internal error, show generic message
   * true = safe to expose details to user
   */
  abstract readonly isOperational: boolean

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
