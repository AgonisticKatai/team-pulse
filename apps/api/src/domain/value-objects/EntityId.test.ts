import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { EntityId } from './EntityId.js'

describe('EntityId Value Object', () => {
  describe('create', () => {
    it('should create valid entity id', () => {
      // Arrange
      const id = 'user-123'

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeNull()
      expect(entityId).toBeDefined()
      expect(entityId!.getValue()).toBe('user-123')
    })

    it('should trim whitespace', () => {
      // Arrange
      const id = '  user-123  '

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeNull()
      expect(entityId!.getValue()).toBe('user-123')
    })

    it('should accept alphanumeric with underscores and hyphens', () => {
      // Arrange
      const validIds = ['user123', 'user_123', 'user-123', 'User-123_ABC', '123', 'a1b2c3']

      // Act & Assert
      for (const id of validIds) {
        const [error, entityId] = EntityId.create({ value: id })
        expect(error).toBeNull()
        expect(entityId).toBeDefined()
      }
    })

    it('should fail with empty string', () => {
      // Arrange
      const id = ''

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Entity ID is required')
      expect(entityId).toBeNull()
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const id = '   '

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Entity ID is required')
      expect(entityId).toBeNull()
    })

    it('should fail with invalid characters - spaces', () => {
      // Arrange
      const id = 'user 123'

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Entity ID contains invalid characters')
      expect(entityId).toBeNull()
    })

    it('should fail with invalid characters - special chars', () => {
      // Arrange
      const id = 'user@123'

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Entity ID contains invalid characters')
      expect(entityId).toBeNull()
    })

    it('should fail with invalid characters - dots', () => {
      // Arrange
      const id = 'user.123'

      // Act
      const [error, entityId] = EntityId.create({ value: id })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Entity ID contains invalid characters')
      expect(entityId).toBeNull()
    })
  })

  describe('getValue', () => {
    it('should return the entity id value', () => {
      // Arrange
      const [, entityId] = EntityId.create({ value: 'user-123' })

      // Act
      const value = entityId!.getValue()

      // Assert
      expect(value).toBe('user-123')
    })
  })

  describe('equals', () => {
    it('should return true for same id', () => {
      // Arrange
      const [, id1] = EntityId.create({ value: 'user-123' })
      const [, id2] = EntityId.create({ value: 'user-123' })

      // Act
      const isEqual = id1!.equals({ other: id2! })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different ids', () => {
      // Arrange
      const [, id1] = EntityId.create({ value: 'user-123' })
      const [, id2] = EntityId.create({ value: 'user-456' })

      // Act
      const isEqual = id1!.equals({ other: id2! })

      // Assert
      expect(isEqual).toBe(false)
    })

    it('should be case sensitive', () => {
      // Arrange
      const [, id1] = EntityId.create({ value: 'User-123' })
      const [, id2] = EntityId.create({ value: 'user-123' })

      // Act
      const isEqual = id1!.equals({ other: id2! })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const [, entityId] = EntityId.create({ value: 'user-123' })

      // Act
      const str = entityId!.toString()

      // Assert
      expect(str).toBe('user-123')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const [, entityId] = EntityId.create({ value: 'user-123' })

      // Act
      const json = entityId!.toJSON()

      // Assert
      expect(json).toBe('user-123')
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const [, entityId] = EntityId.create({ value: 'user-123' })
      const obj = { id: entityId }

      // Act
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe('{"id":"user-123"}')
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const [, entityId] = EntityId.create({ value: 'user-123' })

      // Act & Assert
      expect(entityId!.getValue()).toBe('user-123')
      expect(entityId!.getValue()).toBe('user-123') // Still the same
    })
  })
})
