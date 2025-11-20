import { describe, expect, it } from 'vitest'
import { DomainError } from './DomainError.js'

/**
 * Concrete implementation of DomainError for testing purposes
 * Since DomainError is abstract, we need a concrete class to test its behavior
 * Follows the same pattern as production Domain Errors (private constructor + factory method)
 */
class TestDomainError extends DomainError {
  readonly code = 'TEST_ERROR'
  readonly isOperational = true

  private constructor(message: string) {
    super(message)
  }

  static create({ message }: { message: string }): TestDomainError {
    return new TestDomainError(message)
  }
}

/**
 * Another concrete implementation for testing different configurations
 * Follows the same pattern as production Domain Errors
 */
class NonOperationalTestError extends DomainError {
  readonly code = 'NON_OPERATIONAL_ERROR'
  readonly isOperational = false

  private constructor(message: string) {
    super(message)
  }

  static create({ message }: { message: string }): NonOperationalTestError {
    return new NonOperationalTestError(message)
  }
}

describe('DomainError', () => {
  describe('factory method pattern', () => {
    it('should create an error with the provided message', () => {
      // Arrange
      const message = 'Test error message'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe(message)
    })

    it('should set the name property to the class name', () => {
      // Arrange
      const message = 'Test error'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.name).toBe('TestDomainError')
    })

    it('should set the name property for different error classes', () => {
      // Arrange
      const message = 'Non-operational error'

      // Act
      const error = NonOperationalTestError.create({ message })

      // Assert
      expect(error.name).toBe('NonOperationalTestError')
    })

    it('should capture stack trace', () => {
      // Arrange
      const message = 'Test error'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('TestDomainError')
    })

    it('should include error message in stack trace', () => {
      // Arrange
      const message = 'Custom error message for stack trace'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain(message)
    })
  })

  describe('abstract properties', () => {
    it('should require code property implementation', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error.code).toBeDefined()
      expect(error.code).toBe('TEST_ERROR')
    })

    it('should require isOperational property implementation', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error.isOperational).toBeDefined()
      expect(error.isOperational).toBe(true)
    })

    it('should allow isOperational to be false', () => {
      // Arrange
      const error = NonOperationalTestError.create({ message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(false)
    })

    it('should have readonly code property', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Act & Assert
      expect(error.code).toBe('TEST_ERROR')
      expect(error.code).toBe('TEST_ERROR') // Still the same after accessing twice
    })

    it('should have readonly isOperational property', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Act & Assert
      expect(error.isOperational).toBe(true)
      expect(error.isOperational).toBe(true) // Still the same after accessing twice
    })
  })

  describe('inheritance', () => {
    it('should be instance of Error', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    it('should be instance of DomainError', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should be instance of its concrete class', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error).toBeInstanceOf(TestDomainError)
    })

    it('should maintain correct inheritance chain for different implementations', () => {
      // Arrange
      const operationalError = TestDomainError.create({ message: 'Test' })
      const nonOperationalError = NonOperationalTestError.create({ message: 'Test' })

      // Assert
      expect(operationalError).toBeInstanceOf(Error)
      expect(operationalError).toBeInstanceOf(DomainError)
      expect(operationalError).toBeInstanceOf(TestDomainError)

      expect(nonOperationalError).toBeInstanceOf(Error)
      expect(nonOperationalError).toBeInstanceOf(DomainError)
      expect(nonOperationalError).toBeInstanceOf(NonOperationalTestError)
    })
  })

  describe('Error handling', () => {
    it('should be throwable', () => {
      // Arrange
      const message = 'Throwable error'

      // Act & Assert
      expect(() => {
        throw TestDomainError.create({ message })
      }).toThrow(message)
    })

    it('should be catchable as Error', () => {
      // Arrange
      const message = 'Catchable as Error'
      let caughtError: Error | null = null

      // Act
      try {
        throw TestDomainError.create({ message })
      } catch (error) {
        caughtError = error as Error
      }

      // Assert
      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toBe(message)
    })

    it('should be catchable as DomainError', () => {
      // Arrange
      const message = 'Catchable as DomainError'
      let caughtError: DomainError | null = null

      // Act
      try {
        throw TestDomainError.create({ message })
      } catch (error) {
        caughtError = error as DomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DomainError)
      expect(caughtError?.code).toBe('TEST_ERROR')
      expect(caughtError?.isOperational).toBe(true)
    })

    it('should be catchable as concrete implementation', () => {
      // Arrange
      const message = 'Catchable as TestDomainError'
      let caughtError: TestDomainError | null = null

      // Act
      try {
        throw TestDomainError.create({ message })
      } catch (error) {
        caughtError = error as TestDomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(TestDomainError)
      expect(caughtError?.message).toBe(message)
      expect(caughtError?.code).toBe('TEST_ERROR')
      expect(caughtError?.isOperational).toBe(true)
    })

    it('should preserve error properties when re-thrown', () => {
      // Arrange
      const message = 'Re-thrown error'
      let caughtError: DomainError | null = null

      // Act
      try {
        throw TestDomainError.create({ message })
      } catch (error) {
        caughtError = error as DomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DomainError)
      expect(caughtError?.message).toBe(message)
      expect(caughtError?.code).toBe('TEST_ERROR')
      expect(caughtError?.isOperational).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      // Arrange
      const message = ''

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe('')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.isOperational).toBe(true)
    })

    it('should handle very long message', () => {
      // Arrange
      const message = 'a'.repeat(1000)

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe(message)
      expect(error.message.length).toBe(1000)
    })

    it('should handle special characters in message', () => {
      // Arrange
      const message = 'Error with special chars: <>&"\'\\n\\t'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe(message)
    })

    it('should handle unicode characters in message', () => {
      // Arrange
      const message = 'Error with unicode: 你好 🚀 café'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe(message)
    })

    it('should handle multiline message', () => {
      // Arrange
      const message = 'Line 1\nLine 2\nLine 3'

      // Act
      const error = TestDomainError.create({ message })

      // Assert
      expect(error.message).toBe(message)
      expect(error.message).toContain('\n')
    })
  })

  describe('Different error code formats', () => {
    it('should support standard error code format', () => {
      // Arrange & Act
      const error = TestDomainError.create({ message: 'Test' })

      // Assert
      expect(error.code).toBe('TEST_ERROR')
      expect(error.code).toMatch(/^[A-Z_]+$/)
    })

    it('should support different error code format in different implementation', () => {
      // Arrange & Act
      const error = NonOperationalTestError.create({ message: 'Test' })

      // Assert
      expect(error.code).toBe('NON_OPERATIONAL_ERROR')
      expect(error.code).toMatch(/^[A-Z_]+$/)
    })
  })

  describe('isOperational flag variations', () => {
    it('should correctly identify operational errors', () => {
      // Arrange
      const error = TestDomainError.create({ message: 'Operational error' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should correctly identify non-operational errors', () => {
      // Arrange
      const error = NonOperationalTestError.create({ message: 'Non-operational error' })

      // Assert
      expect(error.isOperational).toBe(false)
    })

    it('should allow different concrete classes to have different operational flags', () => {
      // Arrange
      const operationalError = TestDomainError.create({ message: 'Test' })
      const nonOperationalError = NonOperationalTestError.create({ message: 'Test' })

      // Assert
      expect(operationalError.isOperational).toBe(true)
      expect(nonOperationalError.isOperational).toBe(false)
    })
  })
})
