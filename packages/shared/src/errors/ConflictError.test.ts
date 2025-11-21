import { describe, expect, it } from 'vitest'
import { ConflictError } from './ConflictError'

describe('ConflictError', () => {
  describe('Factory Methods', () => {
    it('should create conflict error with entity and identifier', () => {
      // Act
      const error = ConflictError.create({ entityName: 'User', identifier: 'john@example.com' })

      // Assert
      expect(error.message).toBe('User with identifier "john@example.com" already exists')
      expect(error.metadata.entityName).toBe('User')
      expect(error.metadata.identifier).toBe('john@example.com')
    })

    it('should create conflict error without identifier', () => {
      // Act
      const error = ConflictError.create({ entityName: 'Team' })

      // Assert
      expect(error.message).toBe('Team already exists')
      expect(error.metadata.entityName).toBe('Team')
    })

    it('should create conflict error with custom message', () => {
      // Act
      const error = ConflictError.withMessage({ message: 'Concurrent modification detected' })

      // Assert
      expect(error.message).toBe('Concurrent modification detected')
    })
  })

  describe('Properties', () => {
    it('should have conflict category', () => {
      // Act
      const error = ConflictError.create({ entityName: 'User' })

      // Assert
      expect(error.category).toBe(ConflictError.CATEGORY)
    })

    it('should have low severity', () => {
      // Act
      const error = ConflictError.create({ entityName: 'User' })

      // Assert
      expect(error.severity).toBe('low')
    })

    it('should be operational', () => {
      // Act
      const error = ConflictError.create({ entityName: 'User' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = ConflictError.create({ entityName: 'User' })

      // Assert
      expect(error.code).toBe(ConflictError.CODE)
    })
  })
})
