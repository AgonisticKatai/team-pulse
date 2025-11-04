import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * City Value Object
 * Immutable and self-validating
 */
export class City {
  private static readonly MIN_LENGTH = 2
  private static readonly MAX_LENGTH = 100

  private constructor(private readonly value: string) {}

  /**
   * Factory method to create a City (creational pattern)
   * Returns [error, null] or [null, city]
   */
  static create(value: string): Result<City, ValidationError> {
    // Handle empty case
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('city', 'City is required'))
    }

    const trimmedValue = value.trim()

    // Validate min length
    if (trimmedValue.length < City.MIN_LENGTH) {
      return Err(
        ValidationError.forField('city', `City must be at least ${City.MIN_LENGTH} characters`),
      )
    }

    // Validate max length
    if (trimmedValue.length > City.MAX_LENGTH) {
      return Err(
        ValidationError.forField('city', `City must not exceed ${City.MAX_LENGTH} characters`),
      )
    }

    return Ok(new City(trimmedValue))
  }

  /**
   * Get the city value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Get the city in lowercase
   */
  toLowerCase(): string {
    return this.value.toLowerCase()
  }

  /**
   * Get the city in uppercase
   */
  toUpperCase(): string {
    return this.value.toUpperCase()
  }

  /**
   * Check equality with another City
   */
  equals(other: City): boolean {
    return this.value === other.value
  }

  /**
   * Check case-insensitive equality
   */
  equalsIgnoreCase(other: City): boolean {
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
