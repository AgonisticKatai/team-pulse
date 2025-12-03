import { ValidationError } from '@team-pulse/shared/errors'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { EntityId } from './EntityId'

describe('EntityId', () => {
  describe('create', () => {
    it('should create an EntityId from a valid UUID string', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const result = EntityId.create({ value: validUuid })

      const entityId = expectSuccess(result)
      expect(entityId.getValue()).toBe(validUuid)
    })

    it('should return a ValidationError for an invalid UUID string', () => {
      const invalidUuid = 'invalid-uuid'
      const result = EntityId.create({ value: invalidUuid })

      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe('Invalid UUID format')
    })
  })

  describe('generate', () => {
    it('should generate a new valid EntityId', () => {
      const result = EntityId.generate()

      const entityId = expectSuccess(result)
      expect(EntityId.isValidId({ value: entityId.getValue() })).toBe(true)
    })

    it('should generate unique IDs', () => {
      const result1 = EntityId.generate()
      const result2 = EntityId.generate()

      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(false)
    })
  })

  describe('isValidId', () => {
    it('should return true for valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(EntityId.isValidId({ value: validUuid })).toBe(true)
    })

    it('should return false for invalid UUID', () => {
      expect(EntityId.isValidId({ value: 'invalid' })).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal EntityIds', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const result1 = EntityId.create({ value: uuid })
      const result2 = EntityId.create({ value: uuid })

      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(true)
    })

    it('should return false for different EntityIds', () => {
      const result1 = EntityId.generate()
      const result2 = EntityId.generate()

      const id1 = expectSuccess(result1)
      const id2 = expectSuccess(result2)

      expect(id1.equals({ other: id2 })).toBe(false)
    })
  })
})
