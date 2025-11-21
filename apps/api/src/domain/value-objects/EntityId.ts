import { ValidationError } from '@domain/errors/ValidationError.js'
import type { Result } from '@team-pulse/shared/result'
import { Err, Ok } from '@team-pulse/shared/result'

/**
 * EntityId Value Object
 * Immutable and self-validating
 * Represents a unique identifier for domain entities
 */
export class EntityId {
  protected static readonly ID_REGEX = /^[a-zA-Z0-9_-]+$/

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if entity ID is not empty
   */
  protected static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'id', message: 'Entity ID is required' }))
    }
    return Ok(value.trim())
  }

  /**
   * Validate entity ID format
   */
  protected static validateFormat({ value }: { value: string }): Result<string, ValidationError> {
    if (!EntityId.ID_REGEX.test(value)) {
      return Err(ValidationError.forField({ field: 'id', message: 'Entity ID contains invalid characters' }))
    }
    return Ok(value)
  }

  /**
   * Factory method to create an EntityId (creational pattern)
   * Returns Ok(entityId) or Err(validationError)
   */
  static create({ value }: { value: string }): Result<EntityId, ValidationError> {
    // Validate not empty
    const notEmptyResult = EntityId.validateNotEmpty({ value })
    if (!notEmptyResult.ok) {
      return Err(notEmptyResult.error)
    }

    // Validate format
    const formatResult = EntityId.validateFormat({ value: notEmptyResult.value })
    if (!formatResult.ok) {
      return Err(formatResult.error)
    }

    return Ok(new EntityId({ value: notEmptyResult.value }))
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
