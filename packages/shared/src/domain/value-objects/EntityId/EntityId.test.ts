import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants/validation'
import { ValidationError } from '@team-pulse/shared/errors'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { EntityId } from './EntityId'

describe('EntityId', () => {
  const { uuids } = TEST_CONSTANTS

  describe('create', () => {
    it('should create an EntityId from a valid UUID string', () => {
      // Act
      const result = EntityId.create({ value: uuids.valid })

      // Assert
      const entityId = expectSuccess(result)

      expect(entityId.getValue()).toBe(uuids.valid)
    })

    it('should create a branded EntityId with specific type', () => {
      // Act
      const result = EntityId.create<'User'>({ value: uuids.user1 })

      // Assert
      const entityId = expectSuccess(result)

      expect(entityId.getValue()).toBe(uuids.user1)

      // TypeScript compilation ensures this is EntityId<'User'>
      // This test verifies the brand type is preserved at compile time
      const typeCheck: EntityId<'User'> = entityId
      expect(typeCheck).toBeDefined()
    })

    it('should return a ValidationError for an invalid UUID string', () => {
      // Act
      const result = EntityId.create({ value: uuids.invalid })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.UUID.INVALID_FORMAT)
    })

    it('should return a ValidationError for empty string', () => {
      // Act
      const result = EntityId.create({ value: uuids.empty })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.UUID.INVALID_FORMAT)
    })

    it('should return a ValidationError for UUID with wrong format', () => {
      // Act
      const result = EntityId.create({ value: uuids.incomplete })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.UUID.INVALID_FORMAT)
    })
  })

  describe('generate', () => {
    it('should generate a new valid EntityId', () => {
      // Act
      const result = EntityId.generate()

      // Assert
      const entityId = expectSuccess(result)

      expect(EntityId.isValidId({ value: entityId.getValue() })).toBe(true)
    })

    it('should generate a branded EntityId with specific type', () => {
      // Act
      const result = EntityId.generate<'Team'>()

      // Assert
      const entityId = expectSuccess(result)

      expect(EntityId.isValidId({ value: entityId.getValue() })).toBe(true)

      // TypeScript compilation ensures this is EntityId<'Team'>
      // This test verifies the brand type is preserved at compile time
      const typeCheck: EntityId<'Team'> = entityId
      expect(typeCheck).toBeDefined()
    })

    it('should generate unique IDs', () => {
      // Act
      const result1 = EntityId.generate()
      const result2 = EntityId.generate()

      // Assert
      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(false)
    })
  })

  describe('validate', () => {
    it('should validate a correct UUID', () => {
      // Act
      const result = EntityId.validate({ value: uuids.valid })

      // Assert
      const value = expectSuccess(result)
      expect(value).toBe(uuids.valid)
    })

    it('should return error for invalid UUID', () => {
      // Act
      const result = EntityId.validate({ value: uuids.invalid })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.UUID.INVALID_FORMAT)
    })
  })

  describe('isValidId', () => {
    it('should return true for valid UUID', () => {
      // Assert
      expect(EntityId.isValidId({ value: uuids.valid })).toBe(true)
    })

    it('should return true for generated UUID', () => {
      // Arrange
      const result = EntityId.generate()
      const entityId = expectSuccess(result)

      // Assert
      expect(EntityId.isValidId({ value: entityId.getValue() })).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      // Assert
      expect(EntityId.isValidId({ value: uuids.invalid })).toBe(false)
    })

    it('should return false for empty string', () => {
      // Assert
      expect(EntityId.isValidId({ value: uuids.empty })).toBe(false)
    })

    it('should return false for partial UUID', () => {
      // Assert
      expect(EntityId.isValidId({ value: uuids.incomplete })).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal EntityIds', () => {
      // Act
      const result1 = EntityId.create({ value: uuids.valid })
      const result2 = EntityId.create({ value: uuids.valid })

      // Assert
      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(true)
    })

    it('should return true for equal branded EntityIds', () => {
      // Act
      const result1 = EntityId.create<'User'>({ value: uuids.user1 })
      const result2 = EntityId.create<'User'>({ value: uuids.user1 })

      // Assert
      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(true)
    })

    it('should return false for different EntityIds', () => {
      // Act
      const result1 = EntityId.generate()
      const result2 = EntityId.generate()

      // Assert
      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(false)
    })

    it('should return false for different values with same brand', () => {
      // Act
      const result1 = EntityId.create<'User'>({ value: uuids.user1 })
      const result2 = EntityId.create<'User'>({ value: uuids.user2 })

      // Assert
      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(false)
    })
  })

  describe('getValue', () => {
    it('should return the underlying UUID value', () => {
      // Act
      const result = EntityId.create({ value: uuids.valid })

      // Assert
      const entityId = expectSuccess(result)
      expect(entityId.getValue()).toBe(uuids.valid)
    })

    it('should return immutable value', () => {
      // Arrange
      const result = EntityId.create({ value: uuids.valid })
      const entityId = expectSuccess(result)

      // Act
      const value1 = entityId.getValue()
      const value2 = entityId.getValue()

      // Assert
      expect(value1).toBe(value2)
      expect(value1).toBe(uuids.valid)
    })
  })

  describe('toString', () => {
    it('should return the UUID as string', () => {
      // Act
      const result = EntityId.create({ value: uuids.valid })

      // Assert
      const entityId = expectSuccess(result)
      expect(entityId.toString()).toBe(uuids.valid)
    })

    it('should return same value as getValue', () => {
      // Act
      const result = EntityId.create({ value: uuids.valid })

      // Assert
      const entityId = expectSuccess(result)
      expect(entityId.toString()).toBe(entityId.getValue())
    })
  })

  describe('branded types type safety', () => {
    it('should prevent comparing different brands at compile time', () => {
      // Arrange
      const userId = expectSuccess(EntityId.create<'User'>({ value: uuids.user1 }))
      const teamId = expectSuccess(EntityId.create<'Team'>({ value: uuids.team1 }))

      // This MUST fail TypeScript compilation. If it doesn't, @ts-expect-error will cause a test failure
      // @ts-expect-error - Different brands cannot be compared
      userId.equals({ other: teamId })

      // Verify that same brands CAN be compared
      const anotherUserId = expectSuccess(EntityId.create<'User'>({ value: uuids.user1 }))
      expect(userId.equals({ other: anotherUserId })).toBe(true)

      // Verify the underlying values are accessible but types prevent misuse
      expect(userId.getValue()).toBe(uuids.user1)
      expect(teamId.getValue()).toBe(uuids.team1)
    })

    it('should allow unbranded EntityId to work with any brand', () => {
      // Arrange
      const unbrandedId = expectSuccess(EntityId.create({ value: uuids.valid }))
      const brandedId = expectSuccess(EntityId.create<'User'>({ value: uuids.valid }))

      // Act & Assert - unbranded can be compared with branded
      expect(unbrandedId.getValue()).toBe(brandedId.getValue())
    })
  })
})
