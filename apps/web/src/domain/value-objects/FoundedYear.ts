import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * FoundedYear Value Object
 * Immutable and self-validating
 * Represents the year a team was founded
 */
export class FoundedYear {
  private static readonly MIN_YEAR = 1800
  private static readonly MAX_YEAR = new Date().getFullYear()

  private constructor(private readonly value: number) {}

  /**
   * Factory method to create a FoundedYear (creational pattern)
   * Returns [error, null] or [null, foundedYear]
   * Returns [null, null] for empty values (founded year is optional)
   */
  static create(value: number | null | undefined): Result<FoundedYear | null, ValidationError> {
    // Handle empty case - founded year is optional
    if (value === null || value === undefined) {
      return Ok(null)
    }

    // Validate it's a valid number
    if (!Number.isInteger(value)) {
      return Err(ValidationError.forField('foundedYear', 'Founded year must be an integer'))
    }

    // Validate range
    if (value < FoundedYear.MIN_YEAR) {
      return Err(ValidationError.forField('foundedYear', `Founded year must be ${FoundedYear.MIN_YEAR} or later`))
    }

    if (value > FoundedYear.MAX_YEAR) {
      return Err(ValidationError.forField('foundedYear', `Founded year cannot be in the future (max: ${FoundedYear.MAX_YEAR})`))
    }

    return Ok(new FoundedYear(value))
  }

  /**
   * Get the founded year value
   */
  getValue(): number {
    return this.value
  }

  /**
   * Get the age (years since founding)
   */
  getAge(): number {
    return new Date().getFullYear() - this.value
  }

  /**
   * Check if the team was founded before a specific year
   */
  isBefore(year: number): boolean {
    return this.value < year
  }

  /**
   * Check if the team was founded after a specific year
   */
  isAfter(year: number): boolean {
    return this.value > year
  }

  /**
   * Check equality with another FoundedYear
   */
  equals(other: FoundedYear): boolean {
    return this.value === other.value
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value.toString()
  }

  /**
   * JSON serialization
   */
  toJSON(): number {
    return this.value
  }
}
