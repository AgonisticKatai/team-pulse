import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { v4 as uuidv4 } from 'uuid'
import { entityIdSchema } from './EntityId.schema'
import type { EntityIdType } from './EntityId.types'

/**
 * EntityId Value Object
 *
 * Represents a unique identifier for entities using UUID v4 format.
 * Uses TypeScript branded types to provide compile-time type safety,
 * preventing mixing of different entity IDs.
 *
 * @example
 * // Different brands prevent accidental mixing
 * const userId = EntityId.create<'User'>({ value: '...' })
 * const teamId = EntityId.create<'Team'>({ value: '...' })
 * // userId and teamId are incompatible types at compile time
 *
 * @template Brand - A string literal type that brands this ID for a specific entity type
 */
export class EntityId<Brand extends string = string> {
  private readonly value: EntityIdType
  declare readonly _brand: Brand

  private constructor({ value }: { value: EntityIdType }) {
    this.value = value
  }

  /**
   * Create an EntityId from an existing string value
   *
   * @param value - A UUID v4 string
   * @returns Result containing the EntityId or a ValidationError if the value is invalid
   */
  static create<B extends string = string>({ value }: { value: string }): Result<EntityId<B>, ValidationError> {
    const validationResult = EntityId.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'id',
          message: 'Invalid UUID format',
          value,
        }),
      )
    }

    return Ok(new EntityId({ value: validationResult.value }) as EntityId<B>)
  }

  /**
   * Generate a new EntityId with a random UUID v4
   *
   * @returns Result containing a new EntityId with a freshly generated UUID
   */
  static generate<B extends string = string>(): Result<EntityId<B>, ValidationError> {
    return EntityId.create({ value: uuidv4() })
  }

  static validate({ value }: { value: string }): Result<EntityIdType, ValidationError> {
    const result = entityIdSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.invalidValue({
          field: 'id',
          message: 'Invalid UUID format',
          value,
        }),
      )
    }

    return Ok(result.data)
  }

  static isValidId({ value }: { value: string }): boolean {
    return entityIdSchema.safeParse(value).success
  }

  /**
   * Get the primitive value
   */
  getValue(): EntityIdType {
    return this.value
  }

  /**
   * Check equality with another EntityId of the same brand
   *
   * @param other - Another EntityId to compare with (must be same brand)
   * @returns true if both IDs have the same underlying value
   */
  equals({ other }: { other: EntityId<Brand> }): boolean {
    return this.value === other.value
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value
  }
}
