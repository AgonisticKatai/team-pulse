import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { describe, expect, it } from 'vitest'
import { DomainError } from './DomainError.js'
import { ValidationError } from './ValidationError.js'

describe('ValidationError', () => {
  describe('create factory method', () => {
    it('should create validation error with message only', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.field).toBeUndefined()
      expect(error.details).toBeUndefined()
    })

    it('should create validation error with message and field', () => {
      // Arrange
      const message = 'Email address is required'
      const field = 'email'

      // Act
      const error = ValidationError.create({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.field).toBe(field)
      expect(error.details).toBeUndefined()
    })

    it('should create validation error with message, field and details', () => {
      // Arrange
      const message = 'Email address is required'
      const field = 'email'
      const details = { maxLength: 255, minLength: 5 }

      // Act
      const error = ValidationError.create({ details, field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.field).toBe(field)
      expect(error.details).toEqual(details)
    })
  })

  describe('properties', () => {
    it('should have code property set to VALIDATION_ERROR', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should have isOperational property set to true', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name property set to ValidationError', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error.name).toBe('ValidationError')
    })

    it('should have stack trace', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('ValidationError')
    })
  })

  describe('forField factory method', () => {
    it('should create validation error for specific field', () => {
      // Arrange
      const field = 'email'
      const message = 'Email address is required'

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
      expect(error.field).toBe(field)
      expect(error.details).toBeUndefined()
    })

    it('should create validation error with teamName field', () => {
      // Arrange
      const field = 'teamName'
      const message = 'Team name is required'

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.field).toBe(field)
      expect(error.message).toBe(message)
    })

    it('should create validation error with city field', () => {
      // Arrange
      const field = 'city'
      const message = 'City is required'

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.field).toBe(field)
      expect(error.message).toBe(message)
    })

    it('should create validation error with foundedYear field', () => {
      // Arrange
      const field = 'foundedYear'
      const message = 'Founded year must be 1800 or later'

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.field).toBe(field)
      expect(error.message).toBe(message)
    })
  })

  describe('fromZodError factory method', () => {
    it('should create validation error from Zod error with single field', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ['email'],
            message: 'Invalid email format',
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Invalid email format')
      expect(error.field).toBe('email')
      expect(error.details).toEqual({ errors: zodError.errors })
    })

    it('should create validation error from Zod error with nested path', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ['user', 'email'],
            message: 'Invalid email format',
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('Invalid email format')
      expect(error.field).toBe('user.email')
      expect(error.details).toEqual({ errors: zodError.errors })
    })

    it('should create validation error from Zod error with multiple errors', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ['email'],
            message: 'Invalid email format',
          },
          {
            path: ['password'],
            message: 'Password too short',
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('Invalid email format')
      expect(error.field).toBe('email')
      expect(error.details).toEqual({ errors: zodError.errors })
    })

    it('should handle Zod error with empty path', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: [],
            message: 'Validation failed',
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('Validation failed')
      expect(error.field).toBe('unknown')
      expect(error.details).toEqual({ errors: zodError.errors })
    })

    it('should handle Zod error with no errors array', () => {
      // Arrange
      const zodError = {
        errors: [],
      }

      // Act
      const error = ValidationError.fromZodError(zodError)

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('Validation failed')
      expect(error.field).toBe('unknown')
      expect(error.details).toEqual({ errors: [] })
    })
  })

  describe('inheritance', () => {
    it('should be instance of DomainError', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should be instance of Error', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    it('should be instance of ValidationError', () => {
      // Arrange
      const message = 'Email address is required'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
    })
  })

  describe('Error handling', () => {
    it('should be throwable', () => {
      // Arrange
      const message = 'Email address is required'

      // Act & Assert
      expect(() => {
        throw ValidationError.create({ message })
      }).toThrow(message)
    })

    it('should be catchable as ValidationError', () => {
      // Arrange
      const message = 'Email address is required'
      const field = 'email'
      let caughtError: ValidationError | null = null

      // Act
      try {
        throw ValidationError.create({ field, message })
      } catch (error) {
        caughtError = error as ValidationError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ValidationError)
      expect(caughtError?.message).toBe(message)
      expect(caughtError?.field).toBe(field)
    })

    it('should be catchable as DomainError', () => {
      // Arrange
      const message = 'Email address is required'
      let caughtError: DomainError | null = null

      // Act
      try {
        throw ValidationError.create({ message })
      } catch (error) {
        caughtError = error as DomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DomainError)
      expect(caughtError?.code).toBe('VALIDATION_ERROR')
      expect(caughtError?.isOperational).toBe(true)
    })

    it('should be catchable as Error', () => {
      // Arrange
      const message = 'Email address is required'
      let caughtError: Error | null = null

      // Act
      try {
        throw ValidationError.create({ message })
      } catch (error) {
        caughtError = error as Error
      }

      // Assert
      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toBe(message)
    })
  })

  describe('Immutability', () => {
    it('should have readonly code property', () => {
      // Arrange
      const error = ValidationError.create({ message: 'Email address is required' })

      // Act & Assert
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should have readonly isOperational property', () => {
      // Arrange
      const error = ValidationError.create({ message: 'Email address is required' })

      // Act & Assert
      expect(error.isOperational).toBe(true)
      expect(error.isOperational).toBe(true)
    })

    it('should have readonly field property', () => {
      // Arrange
      const error = ValidationError.create({ field: 'email', message: 'Email address is required' })

      // Act & Assert
      expect(error.field).toBe('email')
      expect(error.field).toBe('email')
    })

    it('should have readonly details property', () => {
      // Arrange
      const details = { minLength: 5 }
      const error = ValidationError.create({ details, field: 'email', message: 'Email address is required' })

      // Act & Assert
      expect(error.details).toEqual(details)
      expect(error.details).toEqual(details)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      // Arrange
      const message = TEST_CONSTANTS.emails.empty

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('')
    })

    it('should handle empty field', () => {
      // Arrange
      const message = 'Validation failed'
      const field = TEST_CONSTANTS.emails.empty

      // Act
      const error = ValidationError.create({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.field).toBe('')
    })

    it('should handle empty details object', () => {
      // Arrange
      const message = 'Validation failed'
      const field = 'email'
      const details = {}

      // Act
      const error = ValidationError.create({ details, field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.details).toEqual({})
    })

    it('should handle complex details object', () => {
      // Arrange
      const message = 'Validation failed'
      const field = 'email'
      const details = {
        errors: [{ path: ['email'], message: 'Invalid' }],
        nested: {
          deep: {
            value: 42,
          },
        },
      }

      // Act
      const error = ValidationError.create({ details, field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.details).toEqual(details)
    })

    it('should handle very long message', () => {
      // Arrange
      const message = 'a'.repeat(1000)

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.message.length).toBe(1000)
    })

    it('should handle special characters in message', () => {
      // Arrange
      const message = 'Email @domain.com is invalid! <script>alert("xss")</script>'

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
    })

    it('should handle special characters in field', () => {
      // Arrange
      const message = 'Validation failed'
      const field = 'user.email[0].address'

      // Act
      const error = ValidationError.create({ field, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.field).toBe(field)
    })
  })
})
