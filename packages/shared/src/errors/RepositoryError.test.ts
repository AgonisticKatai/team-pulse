/**
 * RepositoryError Tests
 *
 * Tests for RepositoryError class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { RepositoryError } from '@errors/RepositoryError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('RepositoryError', () => {
  describe('create', () => {
    it('should create repository error with message only', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.REPOSITORY_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      expect(error.isOperational).toBe(true)
      expect(error.operation).toBeUndefined()
      expect(error.cause).toBeUndefined()
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create repository error with operation', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'

      // Act
      const error = RepositoryError.create({ message, operation })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.metadata).toEqual({
        operation,
        cause: undefined,
      })
    })

    it('should create repository error with cause', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const cause = new Error('Connection timeout')

      // Act
      const error = RepositoryError.create({ message, cause })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.cause).toBe(cause)
      expect(error.metadata).toEqual({
        operation: undefined,
        cause: 'Connection timeout',
      })
    })

    it('should create repository error with operation and cause', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'findById'
      const cause = new Error('Query failed')

      // Act
      const error = RepositoryError.create({ message, operation, cause })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBe(cause)
      expect(error.metadata).toEqual({
        operation,
        cause: 'Query failed',
      })
    })
  })

  describe('forOperation', () => {
    it('should create error for specific operation', () => {
      // Arrange
      const operation = 'delete'
      const message = TEST_CONSTANTS.errors.databaseConnectionLost

      // Act
      const error = RepositoryError.forOperation({ operation, message })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.code).toBe(ERROR_CODES.REPOSITORY_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      expect(error.isOperational).toBe(true)
    })

    it('should create error for operation with cause', () => {
      // Arrange
      const operation = 'update'
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const cause = new Error('Deadlock detected')

      // Act
      const error = RepositoryError.forOperation({ operation, message, cause })

      // Assert
      expect(error).toBeInstanceOf(RepositoryError)
      expect(error.message).toBe(message)
      expect(error.operation).toBe(operation)
      expect(error.cause).toBe(cause)
      expect(error.metadata).toEqual({
        operation,
        cause: 'Deadlock detected',
      })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

      // Assert
      expect(error.code).toBe(ERROR_CODES.REPOSITORY_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name RepositoryError', () => {
      // Arrange & Act
      const error = RepositoryError.create({ message: TEST_CONSTANTS.errors.databaseConnectionLost })

      // Assert
      expect(error.name).toBe('RepositoryError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const operation = 'save'
      const cause = new Error('Constraint violation')
      const error = RepositoryError.create({ message, operation, cause })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'RepositoryError',
        message,
        code: ERROR_CODES.REPOSITORY_ERROR,
        category: ERROR_CATEGORY.INTERNAL,
        severity: ERROR_SEVERITY.HIGH,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata: {
          operation,
          cause: 'Constraint violation',
        },
      })
    })

    it('should serialize to JSON without operation and cause', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.databaseConnectionLost
      const error = RepositoryError.create({ message })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'RepositoryError',
        message,
        code: ERROR_CODES.REPOSITORY_ERROR,
        category: ERROR_CATEGORY.INTERNAL,
        severity: ERROR_SEVERITY.HIGH,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata: {
          operation: undefined,
          cause: undefined,
        },
      })
    })
  })
})
