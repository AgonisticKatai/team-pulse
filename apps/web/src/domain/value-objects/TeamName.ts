import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * TeamName Value Object
 * Immutable and self-validating
 */
export class TeamName {
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 100

  private constructor(private readonly value: string) {}

  /**
   * Factory method to create a TeamName (creational pattern)
   * Returns [error, null] or [null, teamName]
   */
  static create(value: string): Result<TeamName, ValidationError> {
    // Handle empty case
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('name', 'Team name is required'))
    }

    const trimmedValue = value.trim()

    // Validate min length
    if (trimmedValue.length < TeamName.MIN_LENGTH) {
      return Err(ValidationError.forField('name', `Team name must be at least ${TeamName.MIN_LENGTH} characters`))
    }

    // Validate max length
    if (trimmedValue.length > TeamName.MAX_LENGTH) {
      return Err(ValidationError.forField('name', `Team name must not exceed ${TeamName.MAX_LENGTH} characters`))
    }

    return Ok(new TeamName(trimmedValue))
  }

  /**
   * Get the team name value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Get the team name in lowercase
   */
  toLowerCase(): string {
    return this.value.toLowerCase()
  }

  /**
   * Get the team name in uppercase
   */
  toUpperCase(): string {
    return this.value.toUpperCase()
  }

  /**
   * Check equality with another TeamName
   */
  equals(other: TeamName): boolean {
    return this.value === other.value
  }

  /**
   * Check case-insensitive equality
   */
  equalsIgnoreCase(other: TeamName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase()
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value
  }
}
