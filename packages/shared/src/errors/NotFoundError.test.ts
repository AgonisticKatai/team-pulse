import { describe, expect, it } from 'vitest'
import { NotFoundError } from './NotFoundError'

describe('NotFoundError', () => {
  describe('Factory Methods', () => {
    it('should create not found error with entity and identifier', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'User', identifier: '123' })

      // Assert
      expect(error.message).toBe('User with identifier "123" not found')
      expect(error.metadata.entityName).toBe('User')
      expect(error.metadata.identifier).toBe('123')
    })

    it('should create not found error without identifier', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'Team' })

      // Assert
      expect(error.message).toBe('Team not found')
      expect(error.metadata.entityName).toBe('Team')
    })

    it('should create not found error with custom message', () => {
      // Act
      const error = NotFoundError.withMessage({ message: 'Route not found' })

      // Assert
      expect(error.message).toBe('Route not found')
    })
  })

  describe('Properties', () => {
    it('should have not_found category', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'User' })

      // Assert
      expect(error.category).toBe('not_found')
    })

    it('should have low severity', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'User' })

      // Assert
      expect(error.severity).toBe('low')
    })

    it('should be operational', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'User' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = NotFoundError.create({ entityName: 'User' })

      // Assert
      expect(error.code).toBe('NOT_FOUND')
    })
  })
})
