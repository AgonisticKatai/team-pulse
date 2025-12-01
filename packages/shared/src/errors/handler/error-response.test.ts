/**
 * Error Response Tests
 *
 * Tests for safe error response generation
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { InternalError } from '@errors/InternalError.js'
import { NotFoundError, ValidationError } from '@errors/index.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'
import { createSafeErrorResponse } from './error-response.js'

describe('error-response', () => {
  describe('createSafeErrorResponse', () => {
    describe('operational errors', () => {
      it('should return full error details for operational validation error', () => {
        // Arrange
        const error = ValidationError.create({
          message: TEST_CONSTANTS.errors.validationFailed,
          metadata: { field: TEST_CONSTANTS.errorTestData.fields.email },
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.name).toBe('ValidationError')
        expect(response.message).toBe(TEST_CONSTANTS.errors.validationFailed)
        expect(response.code).toBe(ERROR_CODES.VALIDATION_ERROR)
        expect(response.category).toBe(ERROR_CATEGORY.VALIDATION)
        expect(response.severity).toBe(ERROR_SEVERITY.LOW)
        expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(response.metadata).toEqual({ field: TEST_CONSTANTS.errorTestData.fields.email })
      })

      it('should return full error details for operational not found error', () => {
        // Arrange
        const error = NotFoundError.forResource({
          identifier: TEST_CONSTANTS.errorTestData.identifiers.userId,
          resource: TEST_CONSTANTS.errorTestData.resources.user,
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.name).toBe('NotFoundError')
        expect(response.message).toBe(`${TEST_CONSTANTS.errorTestData.resources.user} not found`)
        expect(response.code).toBe(ERROR_CODES.NOT_FOUND_ERROR)
        expect(response.category).toBe(ERROR_CATEGORY.NOT_FOUND)
        expect(response.severity).toBe(ERROR_SEVERITY.LOW)
        expect(response.metadata).toEqual({
          identifier: TEST_CONSTANTS.errorTestData.identifiers.userId,
          resource: TEST_CONSTANTS.errorTestData.resources.user,
        })
      })

      it('should return full error details without metadata when none exists', () => {
        // Arrange
        const error = ValidationError.create({
          message: TEST_CONSTANTS.errors.validationFailed,
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.name).toBe('ValidationError')
        expect(response.message).toBe(TEST_CONSTANTS.errors.validationFailed)
        expect(response.metadata).toBeUndefined()
      })
    })

    describe('non-operational errors', () => {
      it('should return sanitized response for non-operational internal error', () => {
        // Arrange
        const originalError = new Error(TEST_CONSTANTS.errorTestData.handler.originalError)
        const error = InternalError.fromError({ error: originalError })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.name).toBe('InternalError')
        expect(response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
        expect(response.code).toBe(ERROR_CODES.INTERNAL_ERROR)
        expect(response.category).toBe(ERROR_CATEGORY.INTERNAL)
        expect(response.severity).toBe(ERROR_SEVERITY.CRITICAL)
        expect(response.metadata).toBeUndefined()
      })

      it('should hide internal details including stack trace', () => {
        // Arrange
        const originalError = new Error(TEST_CONSTANTS.errors.testError)
        const error = InternalError.fromError({
          context: TEST_CONSTANTS.errorTestData.context.module,
          error: originalError,
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
        expect(response.metadata).toBeUndefined()
        expect(JSON.stringify(response)).not.toContain('stack')
        expect(JSON.stringify(response)).not.toContain(TEST_CONSTANTS.errors.testError)
        expect(JSON.stringify(response)).not.toContain(TEST_CONSTANTS.errorTestData.context.module)
      })

      it('should always use generic message for non-operational errors', () => {
        // Arrange
        const error = InternalError.create({
          message: 'Sensitive database connection string leaked',
          metadata: { connectionString: 'postgresql://secret@localhost:5432/db' },
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
        expect(response.metadata).toBeUndefined()
      })
    })

    describe('timestamp formatting', () => {
      it('should format timestamp as ISO 8601 string', () => {
        // Arrange
        const error = ValidationError.create({
          message: TEST_CONSTANTS.errors.validationFailed,
        })

        // Act
        const response = createSafeErrorResponse({ error })

        // Assert
        expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(() => new Date(response.timestamp)).not.toThrow()
      })
    })
  })
})
