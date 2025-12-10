import { ValidationError } from '@errors/ValidationError'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers'
import { describe, expect, it } from 'vitest'
import { UserId } from './UserId'
import { USER_ID_BRAND } from './UserId.constants'

describe('UserId Value Object', () => {
  // ---------------------------------------------------------------------------
  // 1. Factory Method (Validation)
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a valid TeamId from a valid UUID string', () => {
      // Arrange
      const validUuid = faker.string.uuid()

      // Act
      const result = UserId.create({ id: validUuid })

      // Assert
      const id = expectSuccess(result)

      expect(id).toBe(validUuid)
      expect(typeof id).toBe('string')
    })

    it('should return ValidationError for invalid UUID format', () => {
      // Arrange
      const invalidUuid = faker.string.alphanumeric(10)

      // Act
      const result = UserId.create({ id: invalidUuid })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.metadata).toEqual(expect.objectContaining({ field: USER_ID_BRAND, value: invalidUuid }))
    })

    it('should return ValidationError for empty string', () => {
      expectErrorType({ errorType: ValidationError, result: UserId.create({ id: '' }) })
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Generator (Utility)
  // ---------------------------------------------------------------------------
  describe('random', () => {
    it('should generate a valid UserId', () => {
      // Act
      const id = UserId.random()

      // Assert
      expect(typeof id).toBe('string')

      expectSuccess(UserId.create({ id }))
    })

    it('should generate unique ids on subsequent calls', () => {
      const id1 = UserId.random()
      const id2 = UserId.random()

      expect(id1).not.toBe(id2)
    })
  })
})
