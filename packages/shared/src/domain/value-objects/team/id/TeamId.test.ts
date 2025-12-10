import { ValidationError } from '@errors/ValidationError'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers'
import { describe, expect, it } from 'vitest'
import { TeamId } from './TeamId'
import { TEAM_ID_BRAND } from './TeamId.constants'

describe('TeamId Value Object', () => {
  // ---------------------------------------------------------------------------
  // 1. Factory Method (Validation)
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a valid TeamId from a valid UUID string', () => {
      // Arrange
      const validUuid = faker.string.uuid()

      // Act
      const result = TeamId.create({ id: validUuid })

      // Assert
      const id = expectSuccess(result)

      expect(id).toBe(validUuid)
      expect(typeof id).toBe('string')
    })

    it('should return ValidationError for invalid UUID format', () => {
      // Arrange
      const invalidUuid = faker.string.alphanumeric(10)

      // Act
      const result = TeamId.create({ id: invalidUuid })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.metadata).toEqual(expect.objectContaining({ field: TEAM_ID_BRAND, value: invalidUuid }))
    })

    it('should return ValidationError for empty string', () => {
      expectErrorType({ errorType: ValidationError, result: TeamId.create({ id: '' }) })
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Generator (Utility)
  // ---------------------------------------------------------------------------
  describe('random', () => {
    it('should generate a valid TeamId', () => {
      // Act
      const id = TeamId.random()

      // Assert
      expect(typeof id).toBe('string')

      expectSuccess(TeamId.create({ id }))
    })

    it('should generate unique ids on subsequent calls', () => {
      const id1 = TeamId.random()
      const id2 = TeamId.random()

      expect(id1).not.toBe(id2)
    })
  })
})
