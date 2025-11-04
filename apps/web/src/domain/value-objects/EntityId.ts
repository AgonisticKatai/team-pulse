import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * EntityId Value Object
 * Immutable and self-validating
 * Represents a unique identifier for domain entities
 */
export class EntityId {
  private constructor(private readonly value: string) {}

  /**
   * Factory method to create an EntityId (creational pattern)
   * Returns [error, null] or [null, entityId]
   */
  static create(value: string): Result<EntityId, ValidationError> {
    // Handle empty case
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('id', 'Entity ID is required'))
    }

    const trimmedValue = value.trim()

    // Validate format (assuming UUID-like or numeric IDs)
    // You can adjust this regex based on your backend ID format
    const isValid = trimmedValue.length > 0 && /^[a-zA-Z0-9_-]+$/.test(trimmedValue)

    if (!isValid) {
      return Err(ValidationError.forField('id', 'Entity ID contains invalid characters'))
    }

    return Ok(new EntityId(trimmedValue))
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
  equals(other: EntityId): boolean {
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
