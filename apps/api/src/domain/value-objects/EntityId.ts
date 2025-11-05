import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * EntityId Value Object
 * Immutable and self-validating
 * Represents a unique identifier for domain entities
 */
export class EntityId {
  private static readonly ID_REGEX = /^[a-zA-Z0-9_-]+$/

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if entity ID is not empty
   */
  private static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'id', message: 'Entity ID is required' }))
    }
    return Ok(value.trim())
  }

  /**
   * Validate entity ID format
   */
  private static validateFormat({ value }: { value: string }): Result<string, ValidationError> {
    if (!EntityId.ID_REGEX.test(value)) {
      return Err(
        ValidationError.forField({ field: 'id', message: 'Entity ID contains invalid characters' }),
      )
    }
    return Ok(value)
  }

  /**
   * Factory method to create an EntityId (creational pattern)
   * Returns [error, null] or [null, entityId]
   */
  static create({ value }: { value: string }): Result<EntityId, ValidationError> {
    // Validate not empty
    const [errorNotEmpty, trimmedValue] = EntityId.validateNotEmpty({ value })
    if (errorNotEmpty) {
      return Err(errorNotEmpty)
    }

    // Validate format
    const [errorFormat] = EntityId.validateFormat({ value: trimmedValue! })
    if (errorFormat) {
      return Err(errorFormat)
    }

    return Ok(new EntityId({ value: trimmedValue! }))
  }

  /**
   * Get the entity ID value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Check equality with another EntityId
   */
  equals({ other }: { other: EntityId }): boolean {
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
