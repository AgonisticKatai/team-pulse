/**
 * Base class for all domain errors
 * Follows the backend error hierarchy
 */
export class DomainError extends Error {
  public readonly isOperational: boolean
  public readonly timestamp: Date

  constructor(
    message: string,
    options: {
      isOperational?: boolean
    } = {},
  ) {
    super(message)
    this.name = this.constructor.name
    this.isOperational = options.isOperational ?? true
    this.timestamp = new Date()

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to plain object for logging/serialization
   */
  toObject(): {
    isOperational: boolean
    message: string
    name: string
    timestamp: string
  } {
    return {
      isOperational: this.isOperational,
      message: this.message,
      name: this.name,
      timestamp: this.timestamp.toISOString(),
    }
  }
}
