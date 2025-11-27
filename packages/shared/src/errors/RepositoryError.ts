/**
 * RepositoryError - Represents repository/persistence failures (500 Internal Server Error)
 *
 * Used when data access operations fail (database errors, network issues, etc.)
 * This is an operational error but NOT safe to expose details to users.
 *
 * Examples:
 * - Database connection lost
 * - Query timeout
 * - Constraint violation
 * - Unique key conflict
 *
 * @module errors/RepositoryError
 */

import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

/**
 * Properties for creating a RepositoryError
 */
export interface RepositoryErrorProps {
  message: string
  operation?: string
  cause?: Error
}

/**
 * Properties for creating a RepositoryError for a specific operation
 * Extends RepositoryErrorProps but makes 'operation' required
 */
export type ForOperationProps = RepositoryErrorProps & {
  operation: string
}

export class RepositoryError extends ApplicationError {
  readonly code = ERROR_CODES.REPOSITORY_ERROR
  readonly category = ERROR_CATEGORY.INTERNAL
  readonly severity = ERROR_SEVERITY.HIGH

  /**
   * The database/repository operation that failed (e.g., 'save', 'findById', 'delete')
   */
  readonly operation?: string

  /**
   * The original error that caused this repository error
   * Stored separately for logging purposes, but not exposed to client
   */
  readonly cause?: Error

  private constructor({ message, operation, cause }: RepositoryErrorProps) {
    super({
      message,
      severity: ERROR_SEVERITY.HIGH,
      metadata: {
        operation,
        cause: cause?.message,
      },
      isOperational: true,
    })
    this.operation = operation
    this.cause = cause
  }

  /**
   * Create a repository error
   */
  static create({ message, operation, cause }: RepositoryErrorProps): RepositoryError {
    return new RepositoryError({ message, operation, cause })
  }

  /**
   * Create a repository error for a specific operation
   * Convenience method that makes operation required
   */
  static forOperation({ operation, message, cause }: ForOperationProps): RepositoryError {
    return RepositoryError.create({ message, operation, cause })
  }
}
