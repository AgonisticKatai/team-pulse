import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { v4 as uuidv4, validate as validateUuid } from 'uuid'

/**
 * EntityId Value Object
 * Represents a unique identifier for entities (UUID v4)
 */
export class EntityId {
  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Create an EntityId from an existing string value
   */
  static create({ value }: { value: string }): Result<EntityId, ValidationError> {
    if (!EntityId.isValidId({ value })) {
      return Err(
        ValidationError.invalidValue({
          field: 'id',
          message: 'Invalid UUID format',
          value,
        }),
      )
    }

    return Ok(new EntityId({ value }))
  }

  /**
   * Generate a new EntityId with a random UUID
   */
  static generate(): Result<EntityId, ValidationError> {
    return EntityId.create({ value: uuidv4() })
  }

  static isValidId({ value }: { value: string }): boolean {
    return validateUuid(value)
  }

  /**
   * Get the primitive value
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
   * Convert to string
   */
  toString(): string {
    return this.value
  }
}
