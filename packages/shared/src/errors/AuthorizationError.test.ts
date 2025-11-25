/**
 * AuthorizationError Tests
 *
 * Tests for AuthorizationError domain error class
 */

import { AuthorizationError } from '@errors/AuthorizationError.js'
import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('AuthorizationError', () => {
  describe('create', () => {
    it('should create authorization error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.insufficientPermissions
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }

      // Act
      const error = AuthorizationError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.AUTHORIZATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHORIZATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create authorization error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.insufficientPermissions

      // Act
      const error = AuthorizationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('insufficientPermissions', () => {
    it('should create error with single required permission', () => {
      // Arrange
      const required = TEST_CONSTANTS.errorTestData.permissions.admin
      const actual = TEST_CONSTANTS.errorTestData.permissions.read

      // Act
      const error = AuthorizationError.insufficientPermissions({ required, actual })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe('Insufficient permissions to perform this action')
      expect(error.code).toBe(ERROR_CODES.AUTHORIZATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHORIZATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        required: [required],
        actual,
      })
    })

    it('should create error with multiple required permissions', () => {
      // Arrange
      const required = [TEST_CONSTANTS.errorTestData.permissions.write, TEST_CONSTANTS.errorTestData.permissions.admin]
      const actual = TEST_CONSTANTS.errorTestData.permissions.read

      // Act
      const error = AuthorizationError.insufficientPermissions({ required, actual })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe('Insufficient permissions to perform this action')
      expect(error.metadata).toEqual({
        required,
        actual,
      })
    })

    it('should create error without actual permission', () => {
      // Arrange
      const required = TEST_CONSTANTS.errorTestData.permissions.admin

      // Act
      const error = AuthorizationError.insufficientPermissions({ required })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.metadata).toEqual({
        required: [required],
        actual: undefined,
      })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })

      // Assert
      expect(error.code).toBe(ERROR_CODES.AUTHORIZATION_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.AUTHORIZATION)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name AuthorizationError', () => {
      // Arrange & Act
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })

      // Assert
      expect(error.name).toBe('AuthorizationError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.insufficientPermissions
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = AuthorizationError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'AuthorizationError',
        message,
        code: ERROR_CODES.AUTHORIZATION_ERROR,
        category: ERROR_CATEGORY.AUTHORIZATION,
        severity: ERROR_SEVERITY.MEDIUM,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata,
      })
    })
  })

  describe('withContext', () => {
    it('should add context to error', () => {
      // Arrange
      const error = AuthorizationError.create({ message: TEST_CONSTANTS.errors.insufficientPermissions })
      const context = { [TEST_CONSTANTS.errorTestData.context.operation]: TEST_CONSTANTS.errorTestData.context.module }

      // Act
      const errorWithContext = error.withContext({ ctx: context })

      // Assert
      expect(errorWithContext).toBeInstanceOf(AuthorizationError)
      expect(errorWithContext.metadata).toEqual(context)
    })
  })
})
