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

  public readonly entityName?: string
  public readonly identifier?: string | number

  constructor({ entityName, identifier }: { entityName?: string; identifier?: string | number }) {
    super(`${entityName} with identifier "${identifier}" not found`)
    this.entityName = entityName
    this.identifier = identifier
  }

  /**
   * Factory method to create a NotFoundError
   */
  static create({ entityName, identifier }: { entityName?: string; identifier?: string | number }): NotFoundError {
    return new NotFoundError({ entityName, identifier })
  }
}
