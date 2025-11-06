import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * City Value Object
 * Immutable and self-validating
 */
export class City {
  private static readonly MAX_LENGTH = 100

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if city is not empty
   */
  private static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'city', message: 'Team city cannot be empty' }))
    }
    return Ok(value.trim())
  }

  /**
   * Validate city length
   */
  private static validateLength({ value }: { value: string }): Result<string, ValidationError> {
    if (value.length > City.MAX_LENGTH) {
      return Err(
        ValidationError.forField({
          field: 'city',
          message: 'Team city cannot exceed 100 characters',
        }),
      )
    }
    return Ok(value)
  }

  /**
   * Factory method to create a City (creational pattern)
   * Returns [error, null] or [null, city]
   */
  static create({ value }: { value: string }): Result<City, ValidationError> {
    // Validate not empty
    const [errorNotEmpty, trimmedValue] = City.validateNotEmpty({ value })
    if (errorNotEmpty) {
      return Err(errorNotEmpty)
    }

    // Validate length
    const [errorLength] = City.validateLength({ value: trimmedValue! })
    if (errorLength) {
      return Err(errorLength)
    }

    return Ok(new City({ value: trimmedValue! }))
  }

  /**
   * Get the city value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Check equality with another City
   */
  equals({ other }: { other: City }): boolean {
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
