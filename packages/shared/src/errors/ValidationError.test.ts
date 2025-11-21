import { describe, expect, it } from 'vitest'

import { ValidationError } from './ValidationError'

describe('ValidationError', () => {
  describe('Factory Pattern', () => {
    it('should create validation error with create factory', () => {
      // Act
      const error = ValidationError.create({ message: 'Invalid input' })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.category).toBe('validation')
    })

    it('should create validation error for specific field', () => {
      // Act
      const error = ValidationError.forField({ field: 'email', message: 'Invalid format' })

      // Assert
      expect(error.message).toBe('Invalid format')
      expect(error.metadata.field).toBe('email')
    })

    it('should create from Zod error', () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ['user', 'email'], message: 'Invalid email' },
          { path: ['user', 'name'], message: 'Required' },
        ],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error.message).toBe('Invalid email')
      expect(error.metadata.field).toBe('user.email')
      expect(error.metadata.constraints).toEqual({ errors: zodError.errors })
    })
  })

  describe('Properties', () => {
    it('should have low severity', () => {
      // Act
      const error = ValidationError.create({ message: 'Test' })

      // Assert
      expect(error.severity).toBe('low')
    })

    it('should be operational', () => {
      // Act
      const error = ValidationError.create({ message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should include field in metadata', () => {
      // Act
      const error = ValidationError.create({ message: 'Test', field: 'email' })

      // Assert
      expect(error.metadata.field).toBe('email')
    })

    it('should include details in metadata', () => {
      // Act
      const error = ValidationError.create({
        message: 'Test',
        details: { min: 5, max: 10 },
      })

      // Assert
      expect(error.metadata.constraints).toEqual({ min: 5, max: 10 })
    })
  })
})
