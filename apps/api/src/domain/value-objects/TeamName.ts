import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * TeamName Value Object
 * Immutable and self-validating
 */
export class TeamName {
  private static readonly MAX_LENGTH = 100

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if team name is not empty
   */
  private static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'name', message: 'Team name cannot be empty' }))
    }
    return Ok(value.trim())
  }

  /**
   * Validate team name length
   */
  private static validateLength({ value }: { value: string }): Result<string, ValidationError> {
    if (value.length > TeamName.MAX_LENGTH) {
      return Err(
        ValidationError.forField({
          field: 'name',
          message: 'Team name cannot exceed 100 characters',
        }),
      )
    }
    return Ok(value)
  }

  /**
   * Factory method to create a TeamName (creational pattern)
   * Returns [error, null] or [null, teamName]
   */
  static create({ value }: { value: string }): Result<TeamName, ValidationError> {
    // Validate not empty
    const [errorNotEmpty, trimmedValue] = TeamName.validateNotEmpty({ value })
    if (errorNotEmpty) {
      return Err(errorNotEmpty)
    }

    // Validate length
    const [errorLength] = TeamName.validateLength({ value: trimmedValue! })
    if (errorLength) {
      return Err(errorLength)
    }

    return Ok(new TeamName({ value: trimmedValue! }))
  }

  /**
   * Get the team name value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Check equality with another TeamName
   */
  equals({ other }: { other: TeamName }): boolean {
    return this.value === other.value
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
