import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * FoundedYear Value Object
 * Immutable and self-validating
 * Represents the year a team was founded
 */
export class FoundedYear {
  private static readonly MIN_YEAR = 1800 // Football modern rules started ~1860s

  private readonly value: number

  private constructor({ value }: { value: number }) {
    this.value = value
  }

  /**
   * Validate founded year is within valid range
   */
  private static validateRange({ value }: { value: number }): Result<number, ValidationError> {
    const currentYear = new Date().getFullYear()

    if (value < FoundedYear.MIN_YEAR || value > currentYear) {
      return Err(
        ValidationError.forField({
          field: 'foundedYear',
          message: `Team founded year must be between ${FoundedYear.MIN_YEAR} and ${currentYear}`,
        }),
      )
    }
    return Ok(value)
  }

  /**
   * Factory method to create a FoundedYear (creational pattern)
   * Returns [error, null] or [null, foundedYear]
   */
  static create({ value }: { value: number }): Result<FoundedYear, ValidationError> {
    // Validate range
    const [errorRange] = FoundedYear.validateRange({ value })
    if (errorRange) {
      return Err(errorRange)
    }

    return Ok(new FoundedYear({ value }))
  }

  /**
   * Get the founded year value
   */
  getValue(): number {
    return this.value
  }

  /**
   * Check equality with another FoundedYear
   */
  equals({ other }: { other: FoundedYear }): boolean {
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
