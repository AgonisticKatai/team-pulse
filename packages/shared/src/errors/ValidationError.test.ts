/**
 * ValidationError Tests
 *
 * Tests for ValidationError domain error class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { ValidationError } from '@errors/ValidationError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'
import { ZodError, z } from 'zod'

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
      const schema = z.object({
        email: z.email({ message: TEST_CONSTANTS.errors.invalidFormat }),
      })

      const result = schema.safeParse({
        email: 'invalid-email',
      })

      if (result.success) throw new Error('Setup failed: Zod should have failed')

      // Act
      const error = ValidationError.fromZodError({ error: result.error })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(TEST_CONSTANTS.errors.invalidFormat)

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)

      expect(error.metadata).toEqual({
        errors: result.error.issues,
        field: 'email',
      })
    })

    it('should create validation error from Zod error with multiple issues', () => {
      // Arrange
      const schema = z.object({
        email: z.string().email({ message: TEST_CONSTANTS.errors.invalidFormat }),
        password: z.string().min(1, { message: TEST_CONSTANTS.errors.fieldRequired }),
        username: z.string().min(1, { message: TEST_CONSTANTS.errors.fieldRequired }),
      })

      const result = schema.safeParse({
        email: 'bad-email',
        password: '',
        username: '',
      })

      if (result.success) throw new Error('Setup failed')

      // Act
      const error = ValidationError.fromZodError({ error: result.error })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(TEST_CONSTANTS.errors.invalidFormat)

      expect(error.metadata).toEqual({
        errors: result.error.issues,
        field: 'email',
      })

      expect(error.metadata?.errors).toHaveLength(3)
    })

    it('should create validation error from Zod error with nested path', () => {
      // Arrange
      const schema = z.object({
        user: z.object({
          email: z.string().email({ message: TEST_CONSTANTS.errors.invalidFormat }),
        }),
      })

      const result = schema.safeParse({
        user: {
          email: 'invalid-nested',
        },
      })

      if (result.success) throw new Error('Setup failed')

      // Act
      const error = ValidationError.fromZodError({ error: result.error })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({
        errors: result.error.issues,
        field: 'user.email',
      })
    })

    it('should create validation error from Zod error with array index in path', () => {
      // Arrange
      const schema = z.object({
        items: z.array(
          z.object({
            field: z.string().min(1, { message: TEST_CONSTANTS.errors.fieldRequired }),
          }),
        ),
      })

      const result = schema.safeParse({
        items: [{ field: '' }],
      })

      if (result.success) throw new Error('Setup failed')

      // Act
      const error = ValidationError.fromZodError({ error: result.error })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)

      expect(error.metadata).toEqual({
        errors: result.error.issues,
        field: 'items.0.field',
      })
    })

    it('should handle empty Zod errors array', () => {
      // Arrange
      const emptyZodError = new ZodError([])

      // Act
      const error = ValidationError.fromZodError({ error: emptyZodError })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Validation failed')
      expect(error.metadata).toEqual({
        errors: [],
        field: 'unknown',
      })
    })
  })

  describe('invalidValue', () => {
    it('should create validation error with field and value', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.email
      const value = 'invalid-email'
      const message = TEST_CONSTANTS.errors.invalidFormat

      // Act
      const error = ValidationError.invalidValue({ field, message, value })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({ field, value })
    })

    it('should create validation error with complex value', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.field
      const value = { nested: 'object', with: ['arrays'] }
      const message = TEST_CONSTANTS.errors.validationFailed

      // Act
      const error = ValidationError.invalidValue({ field, message, value })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({ field, value })
    })

    it('should create validation error with null value', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.field
      const value = null
      const message = TEST_CONSTANTS.errors.fieldRequired

      // Act
      const error = ValidationError.invalidValue({ field, message, value })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({ field, value })
    })

    it('should create validation error with undefined value', () => {
      // Arrange
      const field = TEST_CONSTANTS.errorTestData.fields.field
      const value = undefined
      const message = TEST_CONSTANTS.errors.fieldRequired

      // Act
      const error = ValidationError.invalidValue({ field, message, value })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.metadata).toEqual({ field, value })
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
        category: ERROR_CATEGORY.VALIDATION,
        code: ERROR_CODES.VALIDATION_ERROR,
        isOperational: true,
        message,
        metadata,
        name: 'ValidationError',
        severity: ERROR_SEVERITY.LOW,
        timestamp: error.timestamp.toISOString(),
      })
    })
  })
})
