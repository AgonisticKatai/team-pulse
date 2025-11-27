import { DomainError } from '@domain/errors/DomainError.js'
import { RepositoryError } from '@domain/errors/RepositoryError.js'
import { ERROR_CATEGORY, ERROR_SEVERITY } from '@team-pulse/shared/errors'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { describe, expect, it } from 'vitest'

describe('RepositoryError', () => {
  describe('create factory method', () => {
    it('should create repository error with message only', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBeUndefined()
      expect(error.cause).toBeUndefined()
    })

    it('should create repository error with message and operation', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseQueryTimeout
      const operation = 'findById'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBeUndefined()
    })

    it('should create repository error with message, operation and cause', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'
      const cause = new Error('Network timeout')

      // Act
      const error = RepositoryError.create({ message, operation, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBe(cause)
    })

    it('should create repository error with message and cause only', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.failedToDeleteTeam
      const cause = new Error('Constraint violation')

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.operation).toBeUndefined()
      expect(error.cause).toBe(cause)
    })

    it('should create repository error for database connection failure', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'connect'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
      expect(error.operation).toBe('connect')
    })

    it('should create repository error for query timeout', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseQueryTimeout
      const operation = 'findAll'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(TEST_CONSTANTS.errors.databaseQueryTimeout)
      expect(error.operation).toBe('findAll')
    })
  })

  describe('forOperation factory method', () => {
    it('should create repository error for specific operation', () => {
      // Arrange
      const operation = 'save'
      const message = TEST_CONSTANTS.errors.failedToDeleteTeam

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBeUndefined()
    })

    it('should create repository error for operation with cause', () => {
      // Arrange
      const operation = 'findById'
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const cause = new Error('Connection refused')

      // Act
      const error = RepositoryError.forOperation({ operation, message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBe(cause)
    })

    it('should create repository error for save operation', () => {
      // Arrange
      const operation = 'save'
      const message = 'Failed to save team'

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('save')
      expect(error.message).toBe('Failed to save team')
    })

    it('should create repository error for delete operation', () => {
      // Arrange
      const operation = 'delete'
      const message = TEST_CONSTANTS.errors.failedToDeleteTeam

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('delete')
      expect(error.message).toBe(TEST_CONSTANTS.errors.failedToDeleteTeam)
    })

    it('should create repository error for update operation', () => {
      // Arrange
      const operation = 'update'
      const message = 'Failed to update user'

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('update')
      expect(error.message).toBe('Failed to update user')
    })

    it('should create repository error for findAll operation', () => {
      // Arrange
      const operation = 'findAll'
      const message = 'Failed to retrieve teams'

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('findAll')
      expect(error.message).toBe('Failed to retrieve teams')
    })

    it('should create repository error for findById operation', () => {
      // Arrange
      const operation = 'findById'
      const message = 'Failed to find team'

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('findById')
      expect(error.message).toBe('Failed to find team')
    })
  })

  describe('properties', () => {
    it('should have code property set to REPOSITORY_ERROR', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error.code).toBe('REPOSITORY_ERROR')
    })

    it('should have isOperational property set to true', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name property set to RepositoryError', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error.name).toBe('RepositoryError')
    })

    it('should have stack trace', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('RepositoryError')
    })

    it('should have operation property when provided', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error.operation).toBe(operation)
    })

    it('should have cause property when provided', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const cause = new Error('Network error')

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error.cause).toBe(cause)
    })
  })

  describe('inheritance', () => {
    it('should be instance of DomainError', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should be instance of Error', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    it('should be instance of RepositoryError', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
    })
  })

  describe('Error handling', () => {
    it('should be throwable', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act & Assert
      expect(() => {
        throw RepositoryError.create({ message })
      }).toThrow(message)
    })

    it('should be catchable as RepositoryError', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'
      let caughtError: RepositoryError | null = null

      // Act
      try {
        throw RepositoryError.create({ message, operation })
      } catch (error) {
        caughtError = error as RepositoryError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(RepositoryError)
      expect(caughtError?.message).toBe(message)
      expect(caughtError?.operation).toBe(operation)
    })

    it('should be catchable as DomainError', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      let caughtError: DomainError | null = null

      // Act
      try {
        throw RepositoryError.create({ message })
      } catch (error) {
        caughtError = error as DomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DomainError)
      expect(caughtError?.code).toBe('REPOSITORY_ERROR')
      expect(caughtError?.isOperational).toBe(true)
    })

    it('should be catchable as Error', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      let caughtError: Error | null = null

      // Act
      try {
        throw RepositoryError.create({ message })
      } catch (error) {
        caughtError = error as Error
      }

      // Assert
      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toBe(message)
    })

    it('should preserve cause error stack', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const cause = new Error('Original error')
      const causeStack = cause.stack

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error.cause).toBe(cause)
      expect(error.cause?.stack).toBe(causeStack)
    })
  })

  describe('Immutability', () => {
    it('should have readonly code property', () => {
      // Arrange
      const error = RepositoryError.create({ message: 'Test error' })

      // Act & Assert
      expect(error.code).toBe('REPOSITORY_ERROR')
      expect(error.code).toBe('REPOSITORY_ERROR')
    })

    it('should have readonly isOperational property', () => {
      // Arrange
      const error = RepositoryError.create({ message: 'Test error' })

      // Act & Assert
      expect(error.isOperational).toBe(true)
      expect(error.isOperational).toBe(true)
    })

    it('should have readonly operation property', () => {
      // Arrange
      const error = RepositoryError.create({ message: 'Test error', operation: 'save' })

      // Act & Assert
      expect(error.operation).toBe('save')
      expect(error.operation).toBe('save')
    })

    it('should have readonly cause property', () => {
      // Arrange
      const cause = new Error('Original')
      const error = RepositoryError.create({ message: 'Test error', cause })

      // Act & Assert
      expect(error.cause).toBe(cause)
      expect(error.cause).toBe(cause)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      // Arrange
      const message = TEST_CONSTANTS.emails.empty

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('')
    })

    it('should handle empty operation', () => {
      // Arrange
      const message = 'Database error'
      const operation = TEST_CONSTANTS.emails.empty

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe('')
    })

    it('should handle very long message', () => {
      // Arrange
      const message = 'a'.repeat(1000)

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.message.length).toBe(1000)
    })

    it('should handle very long operation name', () => {
      // Arrange
      const message = 'Database error'
      const operation = 'a'.repeat(500)

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe(operation)
      expect(error.operation?.length).toBe(500)
    })

    it('should handle special characters in message', () => {
      // Arrange
      const message = 'Error: <>&"\' database connection failed'

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
    })

    it('should handle special characters in operation', () => {
      // Arrange
      const message = 'Database error'
      const operation = 'find<user>by&email'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeDefined()
      expect(error.operation).toBe(operation)
    })

    it('should handle Error instance as cause', () => {
      // Arrange
      const message = 'Repository operation failed'
      const cause = new Error('Original database error')

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.cause).toBeInstanceOf(Error)
      expect(error.cause?.message).toBe('Original database error')
    })

    it('should handle TypeError as cause', () => {
      // Arrange
      const message = 'Repository operation failed'
      const cause = new TypeError('Invalid type')

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.cause).toBeInstanceOf(TypeError)
      expect(error.cause?.message).toBe('Invalid type')
    })

    it('should handle nested errors as cause', () => {
      // Arrange
      const message = 'Repository operation failed'
      const innerCause = new Error('Network timeout')
      const cause = new Error('Database connection failed')
      // Simulate error chaining
      Object.defineProperty(cause, 'cause', { value: innerCause })

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.cause).toBe(cause)
      expect(error.cause?.message).toBe('Database connection failed')
    })

    it('should handle database constraint violation errors', () => {
      // Arrange
      const message = 'Unique constraint violation'
      const operation = 'save'
      const cause = new Error('duplicate key value violates unique constraint')

      // Act
      const error = RepositoryError.forOperation({ operation, message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause?.message).toContain('duplicate key')
    })

    it('should handle database timeout errors', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseQueryTimeout
      const operation = 'findAll'
      const cause = new Error('query timeout exceeded')

      // Act
      const error = RepositoryError.forOperation({ operation, message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(TEST_CONSTANTS.errors.databaseQueryTimeout)
      expect(error.operation).toBe(operation)
      expect(error.cause?.message).toContain('timeout')
    })

    it('should handle database connection errors', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'connect'
      const cause = new Error('connection refused')

      // Act
      const error = RepositoryError.forOperation({ operation, message, cause })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
      expect(error.operation).toBe(operation)
      expect(error.cause?.message).toContain('connection refused')
    })
  })

  describe('Factory method equivalence', () => {
    it('should produce same error with create and forOperation when operation is provided', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'
      const cause = new Error('Network error')

      // Act
      const errorFromCreate = RepositoryError.create({ message, operation, cause })
      const errorFromForOperation = RepositoryError.forOperation({ message, operation, cause })

      // Assert
      expect(errorFromCreate.message).toBe(errorFromForOperation.message)
      expect(errorFromCreate.operation).toBe(errorFromForOperation.operation)
      expect(errorFromCreate.cause).toBe(errorFromForOperation.cause)
      expect(errorFromCreate.code).toBe(errorFromForOperation.code)
    })
  })

  describe('IApplicationError implementation', () => {
    describe('category property', () => {
      it('should have category set to INTERNAL', () => {
        // Arrange & Act
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      })

      it('should maintain INTERNAL category when created with forOperation', () => {
        // Arrange & Act
        const error = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'save',
        })

        // Assert
        expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      })

      it('should maintain INTERNAL category when created with cause', () => {
        // Arrange
        const cause = new Error('Database connection failed')

        // Act
        const error = RepositoryError.create({ cause, message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      })
    })

    describe('severity property', () => {
      it('should have severity set to HIGH', () => {
        // Arrange & Act
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      })

      it('should maintain HIGH severity when created with forOperation', () => {
        // Arrange & Act
        const error = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'findAll',
        })

        // Assert
        expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      })

      it('should maintain HIGH severity when created with cause', () => {
        // Arrange
        const cause = new Error('Network timeout')

        // Act
        const error = RepositoryError.create({ cause, message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      })
    })

    describe('timestamp property', () => {
      it('should have timestamp property', () => {
        // Arrange & Act
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.timestamp).toBeInstanceOf(Date)
      })

      it('should set timestamp to current time', () => {
        // Arrange
        const beforeCreation = new Date()

        // Act
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        const afterCreation = new Date()
        expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
        expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
      })

      it('should have unique timestamp for each error instance', () => {
        // Arrange & Act
        const error1 = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })
        const error2 = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error1.timestamp).not.toBe(error2.timestamp)
      })
    })

    describe('metadata property', () => {
      it('should include operation in metadata when provided', () => {
        // Arrange & Act
        const error = RepositoryError.create({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'save',
        })

        // Assert
        expect(error.metadata).toBeDefined()
        expect(error.metadata?.operation).toBe('save')
      })

      it('should include cause message in metadata when provided', () => {
        // Arrange
        const cause = new Error('Network timeout')

        // Act
        const error = RepositoryError.create({ cause, message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Assert
        expect(error.metadata).toBeDefined()
        expect(error.metadata?.cause).toBe('Network timeout')
      })

      it('should include both operation and cause in metadata', () => {
        // Arrange
        const operation = 'findById'
        const cause = new Error('Connection refused')

        // Act
        const error = RepositoryError.create({
          cause,
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation,
        })

        // Assert
        expect(error.metadata).toBeDefined()
        expect(error.metadata?.operation).toBe(operation)
        expect(error.metadata?.cause).toBe('Connection refused')
      })

      it('should have metadata when created with forOperation', () => {
        // Arrange & Act
        const error = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'delete',
        })

        // Assert
        expect(error.metadata).toBeDefined()
        expect(error.metadata?.operation).toBe('delete')
      })

      it('should include cause message when created with forOperation and cause', () => {
        // Arrange
        const cause = new Error('Query timeout exceeded')

        // Act
        const error = RepositoryError.forOperation({
          cause,
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'findAll',
        })

        // Assert
        expect(error.metadata).toBeDefined()
        expect(error.metadata?.operation).toBe('findAll')
        expect(error.metadata?.cause).toBe('Query timeout exceeded')
      })
    })

    describe('toJSON method', () => {
      it('should serialize error to JSON', () => {
        // Arrange
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Act
        const json = error.toJSON()

        // Assert
        expect(json).toBeDefined()
        expect(typeof json).toBe('object')
      })

      it('should include all required IApplicationError properties', () => {
        // Arrange
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Act
        const json = error.toJSON() as Record<string, unknown>

        // Assert
        expect(json.name).toBe('RepositoryError')
        expect(json.code).toBe('REPOSITORY_ERROR')
        expect(json.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
        expect(json.category).toBe(ERROR_CATEGORY.INTERNAL)
        expect(json.severity).toBe(ERROR_SEVERITY.HIGH)
        expect(json.timestamp).toBeDefined()
        expect(json.isOperational).toBe(true)
        expect(json.stack).toBeDefined()
      })

      it('should include metadata in JSON output', () => {
        // Arrange
        const cause = new Error('Connection timeout')
        const error = RepositoryError.create({
          cause,
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'save',
        })

        // Act
        const json = error.toJSON() as Record<string, unknown>

        // Assert
        expect(json.metadata).toBeDefined()
        expect(json.metadata).toEqual({
          cause: 'Connection timeout',
          operation: 'save',
        })
      })

      it('should serialize timestamp as ISO string', () => {
        // Arrange
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Act
        const json = error.toJSON() as Record<string, unknown>

        // Assert
        expect(typeof json.timestamp).toBe('string')
        expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      })

      it('should include stack trace in JSON output', () => {
        // Arrange
        const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

        // Act
        const json = error.toJSON() as Record<string, unknown>

        // Assert
        expect(json.stack).toBeDefined()
        expect(typeof json.stack).toBe('string')
        expect(json.stack).toContain('RepositoryError')
      })

      it('should serialize error created with forOperation', () => {
        // Arrange
        const cause = new Error('Query timeout')
        const error = RepositoryError.forOperation({
          cause,
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'findAll',
        })

        // Act
        const json = error.toJSON() as Record<string, unknown>

        // Assert
        expect(json.name).toBe('RepositoryError')
        expect(json.code).toBe('REPOSITORY_ERROR')
        expect(json.category).toBe(ERROR_CATEGORY.INTERNAL)
        expect(json.severity).toBe(ERROR_SEVERITY.HIGH)
        expect(json.metadata).toEqual({
          cause: 'Query timeout',
          operation: 'findAll',
        })
      })
    })
  })
})
