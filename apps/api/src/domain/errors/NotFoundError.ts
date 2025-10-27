import { DomainError } from './DomainError.js'

/**
 * Not Found Error
 *
 * Thrown when a requested entity does not exist.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Team with ID "abc123" not found
 * - Match not found
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND'
  readonly isOperational = true

  constructor(
    public readonly entityName: string,
    public readonly identifier: string | number,
  ) {
    super(`${entityName} with identifier "${identifier}" not found`)
  }
}
