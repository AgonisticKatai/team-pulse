/**
 * AuthenticationError Tests
 *
 * Tests for AuthenticationError domain error class
 */

import { AuthenticationError } from '@errors/AuthenticationError.js'
import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('AuthenticationError', () => {
  describe('create', () => {
    it('should create authentication error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.authenticationFailed
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }

      // Act
      const error = AuthenticationError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create authentication error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.authenticationFailed

      // Act
      const error = AuthenticationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('invalidCredentials', () => {
    it('should create error for invalid credentials', () => {
      // Arrange & Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Invalid credentials')
      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({ reason: 'invalid_credentials' })
    })
  })

  describe('invalidToken', () => {
    it('should create error for invalid token without custom reason', () => {
      // Arrange & Act
      const error = AuthenticationError.invalidToken()

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Invalid or expired token')
      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({ reason: 'invalid_token' })
    })

    it('should create error for invalid token with custom reason', () => {
      // Arrange
      const customReason = TEST_CONSTANTS.errorTestData.reasons.invalidToken

      // Act
      const error = AuthenticationError.invalidToken({ reason: customReason })

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Invalid or expired token')
      expect(error.metadata).toEqual({ reason: customReason })
    })
  })

  describe('missingToken', () => {
    it('should create error for missing token', () => {
      // Arrange & Act
      const error = AuthenticationError.missingToken()

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Authentication token is required')
      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({ reason: 'missing_token' })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = AuthenticationError.create({ message: TEST_CONSTANTS.errors.authenticationFailed })

      // Assert
      expect(error.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = AuthenticationError.create({ message: TEST_CONSTANTS.errors.authenticationFailed })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = AuthenticationError.create({ message: TEST_CONSTANTS.errors.authenticationFailed })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = AuthenticationError.create({ message: TEST_CONSTANTS.errors.authenticationFailed })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name AuthenticationError', () => {
      // Arrange & Act
      const error = AuthenticationError.create({ message: TEST_CONSTANTS.errors.authenticationFailed })

      // Assert
      expect(error.name).toBe('AuthenticationError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.authenticationFailed
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = AuthenticationError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        category: ERROR_CATEGORY.AUTHENTICATION,
        code: ERROR_CODES.AUTHENTICATION_ERROR,
        isOperational: true,
        message,
        metadata,
        name: 'AuthenticationError',
        severity: ERROR_SEVERITY.MEDIUM,
        timestamp: error.timestamp.toISOString(),
      })
    })
  })
})
