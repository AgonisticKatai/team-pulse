import { ValidationError } from '@domain/errors/ValidationError.js'
import type { Result } from '@team-pulse/shared/result'
import { Err, Ok } from '@team-pulse/shared/result'

/**
 * City Value Object
 * Immutable and self-validating
 */
export class City {
  protected static readonly MAX_LENGTH = 100

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if city is not empty
   */
  protected static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'city', message: 'Team city cannot be empty' }))
    }
    return Ok(value.trim())
  }

  /**
   * Validate city length
   */
  protected static validateLength({ value }: { value: string }): Result<string, ValidationError> {
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
   * Returns Ok(city) or Err(validationError)
   */
  static create({ value }: { value: string }): Result<City, ValidationError> {
    // Validate not empty
    const notEmptyResult = City.validateNotEmpty({ value })
    if (!notEmptyResult.ok) {
      return Err(notEmptyResult.error)
    }

    // Validate length
    const lengthResult = City.validateLength({ value: notEmptyResult.value })
    if (!lengthResult.ok) {
      return Err(lengthResult.error)
    }

    return Ok(new City({ value: notEmptyResult.value }))
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
