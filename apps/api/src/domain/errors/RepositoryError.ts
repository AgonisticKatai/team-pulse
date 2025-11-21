import { DomainError } from '@domain/errors/DomainError.js'
import type { ForOperationProps, RepositoryErrorProps } from '@domain/errors/RepositoryError.types.js'

// Re-export public types
export type { ForOperationProps, RepositoryErrorProps }

/**
 * Repository Error
 *
 * Represents repository operation failures (database errors, network issues, etc.).
 * This is an operational error but NOT safe to expose details to users.
 *
 * Examples:
 * - Database connection lost
 * - Query timeout
 * - Constraint violation
 * - Unique key conflict
 */
export class RepositoryError extends DomainError {
  readonly code = 'REPOSITORY_ERROR'
  readonly isOperational = true

  public readonly operation?: string
  public readonly cause?: Error

  private constructor({ message, operation, cause }: RepositoryErrorProps) {
    super(message)
    this.operation = operation
    this.cause = cause
  }

  /**
   * Factory method to create a repository error
   */
  static create({ message, operation, cause }: RepositoryErrorProps): RepositoryError {
    return new RepositoryError({ cause, message, operation })
  }

  /**
   * Create repository error for a specific operation
   * Delegates to create() for consistency
   */
  static forOperation({ operation, message, cause }: ForOperationProps): RepositoryError {
    return RepositoryError.create({ cause, message, operation })
  }
}
