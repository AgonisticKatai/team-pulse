/**
 * ValidationError Tests
 *
 * Tests for ValidationError domain error class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { ValidationError } from '@errors/ValidationError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('ValidationError', () => {
  describe('create', () => {
    it('should create validation error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.validationFailed
      const metadata = { [TEST_CONSTANTS.errorTestData.fields.field]: TEST_CONSTANTS.errorTestData.fields.email }

      // Act
      const error = ValidationError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create validation error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.validationFailed

      // Act
      const error = ValidationError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('forField', () => {
    it('should create validation error for specific field', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.email
      const message = TEST_CONSTANTS.errors.invalidFormat

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({ field })
    })

    it('should create validation error with field in metadata for password field', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.password
      const message = TEST_CONSTANTS.errors.fieldRequired

      // Act
      const error = ValidationError.forField({ field, message })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({ field: TEST_CONSTANTS.errorTestData.fields.password })
    })
  })

  describe('fromZodError', () => {
    it('should create validation error from Zod error with single issue', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: [TEST_CONSTANTS.errorTestData.fields.email],
            message: TEST_CONSTANTS.errors.invalidFormat,
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError({ error: zodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(TEST_CONSTANTS.errors.invalidFormat)
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        field: TEST_CONSTANTS.errorTestData.fields.email,
        errors: zodError.errors,
      })
    })

    it('should create validation error from Zod error with multiple issues', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: [TEST_CONSTANTS.errorTestData.fields.email],
            message: TEST_CONSTANTS.errors.invalidFormat,
          },
          {
            path: [TEST_CONSTANTS.errorTestData.fields.password],
            message: TEST_CONSTANTS.errors.fieldRequired,
          },
          {
            path: [TEST_CONSTANTS.errorTestData.fields.username],
            message: TEST_CONSTANTS.errors.fieldRequired,
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError({ error: zodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(TEST_CONSTANTS.errors.invalidFormat)
      expect(error.metadata).toEqual({
        field: TEST_CONSTANTS.errorTestData.fields.email,
        errors: zodError.errors,
      })
    })

    it('should create validation error from Zod error with nested path', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ['user', TEST_CONSTANTS.errorTestData.fields.email],
            message: TEST_CONSTANTS.errors.invalidFormat,
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError({ error: zodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({
        field: 'user.email',
        errors: zodError.errors,
      })
    })

    it('should create validation error from Zod error with array index in path', () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ['items', 0, TEST_CONSTANTS.errorTestData.fields.field],
            message: TEST_CONSTANTS.errors.fieldRequired,
          },
        ],
      }

      // Act
      const error = ValidationError.fromZodError({ error: zodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({
        field: 'items.0.field',
        errors: zodError.errors,
      })
    })

    it('should handle empty Zod errors array', () => {
      // Arrange
      const zodError = {
        errors: [],
      }

      // Act
      const error = ValidationError.fromZodError({ error: zodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Validation failed')
      expect(error.metadata).toEqual({
        field: 'unknown',
        errors: [],
      })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = ValidationError.create({ message: TEST_CONSTANTS.errors.validationFailed })

      // Assert
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = ValidationError.create({ message: TEST_CONSTANTS.errors.validationFailed })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = ValidationError.create({ message: TEST_CONSTANTS.errors.validationFailed })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = ValidationError.create({ message: TEST_CONSTANTS.errors.validationFailed })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name ValidationError', () => {
      // Arrange & Act
      const error = ValidationError.create({ message: TEST_CONSTANTS.errors.validationFailed })

      // Assert
      expect(error.name).toBe('ValidationError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.validationFailed
      const metadata = { [TEST_CONSTANTS.errorTestData.fields.field]: TEST_CONSTANTS.errorTestData.fields.email }
      const error = ValidationError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'ValidationError',
        message,
        code: ERROR_CODES.VALIDATION_ERROR,
        category: ERROR_CATEGORY.VALIDATION,
        severity: ERROR_SEVERITY.LOW,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata,
      })
    })
  })
})
