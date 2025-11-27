/**
 * InternalError Tests
 *
 * Tests for InternalError domain error class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { InternalError } from '@errors/InternalError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('InternalError', () => {
  describe('create', () => {
    it('should create internal error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.internalServerError
      const metadata = { errorId: TEST_CONSTANTS.errorTestData.identifiers.identifier }

      // Act
      const error = InternalError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      expect(error.severity).toBe(ERROR_SEVERITY.CRITICAL)
      expect(error.isOperational).toBe(false)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create internal error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.internalServerError

      // Act
      const error = InternalError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('fromError', () => {
    it('should create internal error from Error with context', () => {
      // Arrange
      const originalError = new Error(TEST_CONSTANTS.errors.testError)
      const context = TEST_CONSTANTS.errorTestData.context.module

      // Act
      const error = InternalError.fromError({ error: originalError, context })

      // Assert
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toBe(`Internal error: ${context}`)
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
      expect(error.severity).toBe(ERROR_SEVERITY.CRITICAL)
      expect(error.isOperational).toBe(false)
      expect(error.metadata).toEqual({
        originalMessage: originalError.message,
        stack: originalError.stack,
        context,
      })
    })

    it('should create internal error from Error without context', () => {
      // Arrange
      const originalError = new Error(TEST_CONSTANTS.errors.testError)

      // Act
      const error = InternalError.fromError({ error: originalError })

      // Assert
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toBe('Internal server error')
      expect(error.metadata).toEqual({
        originalMessage: originalError.message,
        stack: originalError.stack,
      })
    })

    it('should preserve original error stack trace', () => {
      // Arrange
      const originalError = new Error(TEST_CONSTANTS.errors.testError)

      // Act
      const error = InternalError.fromError({ error: originalError })

      // Assert
      expect(error.metadata).toHaveProperty('stack')
      expect(error.metadata?.stack).toBe(originalError.stack)
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = InternalError.create({ message: TEST_CONSTANTS.errors.internalServerError })

      // Assert
      expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = InternalError.create({ message: TEST_CONSTANTS.errors.internalServerError })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.INTERNAL)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = InternalError.create({ message: TEST_CONSTANTS.errors.internalServerError })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.CRITICAL)
    })

    it('should NOT be operational', () => {
      // Arrange & Act
      const error = InternalError.create({ message: TEST_CONSTANTS.errors.internalServerError })

      // Assert
      expect(error.isOperational).toBe(false)
    })

    it('should have name InternalError', () => {
      // Arrange & Act
      const error = InternalError.create({ message: TEST_CONSTANTS.errors.internalServerError })

      // Assert
      expect(error.name).toBe('InternalError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.internalServerError
      const metadata = { errorId: TEST_CONSTANTS.errorTestData.identifiers.identifier }
      const error = InternalError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'InternalError',
        message,
        code: ERROR_CODES.INTERNAL_ERROR,
        category: ERROR_CATEGORY.INTERNAL,
        severity: ERROR_SEVERITY.CRITICAL,
        timestamp: error.timestamp.toISOString(),
        isOperational: false,
        metadata,
      })
    })
  })
})
