import { describe, expect, it } from 'vitest'
import { InternalError } from './InternalError'

describe('InternalError', () => {
  describe('Factory Methods', () => {
    it('should create internal error with message', () => {
      // Act
      const error = InternalError.create({ message: 'Database connection failed' })

      // Assert
      expect(error.message).toBe('Database connection failed')
    })

    it('should create internal error with default message', () => {
      // Act
      const error = InternalError.create({})

      // Assert
      expect(error.message).toBe('An unexpected error occurred')
    })

    it('should create from unknown error', () => {
      // Arrange
      const originalError = new Error('Null pointer exception')

      // Act
      const error = InternalError.fromUnknown({ error: originalError })

      // Assert
      expect(error.message).toBe('Null pointer exception')
      expect(error.cause).toBe(originalError)
    })

    it('should create from non-Error unknown', () => {
      // Act
      const error = InternalError.fromUnknown({ error: 'Something went wrong' })

      // Assert
      expect(error.message).toBe('Something went wrong')
    })

    it('should preserve cause error', () => {
      // Arrange
      const cause = new Error('Original error')

      // Act
      const error = InternalError.create({ message: 'Wrapped error', cause })

      // Assert
      expect(error.cause).toBe(cause)
    })
  })

  describe('Properties', () => {
    it('should have internal category', () => {
      // Act
      const error = InternalError.create({ message: 'Test' })

      // Assert
      expect(error.category).toBe(InternalError.CATEGORY)
    })

    it('should have critical severity', () => {
      // Act
      const error = InternalError.create({ message: 'Test' })

      // Assert
      expect(error.severity).toBe('critical')
    })

    it('should NOT be operational', () => {
      // Act
      const error = InternalError.create({ message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(false)
    })

    it('should have correct code', () => {
      // Act
      const error = InternalError.create({ message: 'Test' })

      // Assert
      expect(error.code).toBe(InternalError.CODE)
    })
  })
})
