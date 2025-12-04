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

  static create<B extends string = string>({ value }: { value: string }): Result<EntityId<B>, ValidationError> {
    const validationResult = EntityId.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'id',
          message: validationResult.error.message,
          value,
        }),
      )
    }

    return Ok(new EntityId({ value: validationResult.value }) as EntityId<B>)
  }

  static generate<B extends string = string>(): Result<EntityId<B>, ValidationError> {
    return EntityId.create({ value: uuidv4() })
  }

  static validate({ value }: { value: string }): Result<EntityIdType, ValidationError> {
    const result = entityIdSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.fromZodError({
          error: result.error,
        }),
      )
    }

    return Ok(result.data)
  }

  static isValidId({ value }: { value: string }): boolean {
    return entityIdSchema.safeParse(value).success
  }

  getValue(): EntityIdType {
    return this.value
  }

  equals({ other }: { other: EntityId<Brand> }): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
