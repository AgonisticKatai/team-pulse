import { DomainError } from './DomainError.js'

/**
 * DuplicatedError Error
 *
 * Thrown when a requested entity already exists.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Team with ID "abc123" already exists
 * - Match already exists
 */
export class DuplicatedError extends DomainError {
  readonly code = 'DUPLICATED'
  readonly isOperational = true

  public readonly entityName?: string
  public readonly identifier?: string | number

  private constructor({ entityName, identifier }: { entityName?: string; identifier?: string | number }) {
    super(`${entityName} with identifier "${identifier}" already exists`)
    this.entityName = entityName
    this.identifier = identifier
  }

  /**
   * Factory method to create a DuplicatedError
   */
  static create({ entityName, identifier }: { entityName?: string; identifier?: string | number }): DuplicatedError {
    return new DuplicatedError({ entityName, identifier })
  }
}
