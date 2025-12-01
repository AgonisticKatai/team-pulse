/**
 * Error Handler Tests
 *
 * Tests for framework-agnostic error handler
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import {
  AuthenticationError,
  BusinessRuleError,
  ConflictError,
  ExternalServiceError,
  InternalError,
  NotFoundError,
  ValidationError,
} from '@errors/index.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ErrorHandler } from './error-handler.js'
import { HTTP_STATUS } from './http-status-codes.js'
import type { ILogger } from './logger.js'

describe('error-handler', () => {
  let mockLogger: ILogger
  let errorHandler: ErrorHandler

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }
    errorHandler = ErrorHandler.create({ logger: mockLogger })
  })

  describe('create', () => {
    it('should create error handler with logger', () => {
      // Act
      const handler = ErrorHandler.create({ logger: mockLogger })

      // Assert
      expect(handler).toBeInstanceOf(ErrorHandler)
    })
  })

  describe('handle - operational errors', () => {
    describe('ValidationError', () => {
      it('should handle validation error with full details', () => {
        // Arrange
        const error = ValidationError.forField({
          field: TEST_CONSTANTS.errorTestData.fields.email,
          message: TEST_CONSTANTS.errors.validationFailed,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
        expect(result.response.name).toBe('ValidationError')
        expect(result.response.message).toBe(TEST_CONSTANTS.errors.validationFailed)
        expect(result.response.code).toBe(ERROR_CODES.VALIDATION_ERROR)
        expect(result.response.category).toBe(ERROR_CATEGORY.VALIDATION)
        expect(result.response.severity).toBe(ERROR_SEVERITY.LOW)
        expect(result.response.metadata).toEqual({ field: TEST_CONSTANTS.errorTestData.fields.email })
      })

      it('should log validation error with info level', () => {
        // Arrange
        const error = ValidationError.create({
          message: TEST_CONSTANTS.errors.validationFailed,
        })

        // Act
        errorHandler.handle({ error })

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith({
          context: expect.objectContaining({
            category: ERROR_CATEGORY.VALIDATION,
            code: ERROR_CODES.VALIDATION_ERROR,
            isOperational: true,
            severity: ERROR_SEVERITY.LOW,
          }),
          message: TEST_CONSTANTS.errors.validationFailed,
        })
      })
    })

    describe('AuthenticationError', () => {
      it('should handle authentication error', () => {
        // Arrange
        const error = AuthenticationError.invalidCredentials()

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
        expect(result.response.name).toBe('AuthenticationError')
        expect(result.response.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR)
        expect(result.response.category).toBe(ERROR_CATEGORY.AUTHENTICATION)
        expect(result.response.severity).toBe(ERROR_SEVERITY.MEDIUM)
      })

      it('should log authentication error with warn level', () => {
        // Arrange
        const error = AuthenticationError.invalidToken()

        // Act
        errorHandler.handle({ error })

        // Assert
        expect(mockLogger.warn).toHaveBeenCalledWith({
          context: expect.objectContaining({
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            severity: ERROR_SEVERITY.MEDIUM,
          }),
          message: 'Invalid or expired token',
        })
      })
    })

    describe('NotFoundError', () => {
      it('should handle not found error', () => {
        // Arrange
        const error = NotFoundError.forResource({
          identifier: TEST_CONSTANTS.errorTestData.identifiers.userId,
          resource: TEST_CONSTANTS.errorTestData.resources.user,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
        expect(result.response.name).toBe('NotFoundError')
        expect(result.response.code).toBe(ERROR_CODES.NOT_FOUND_ERROR)
        expect(result.response.category).toBe(ERROR_CATEGORY.NOT_FOUND)
      })
    })

    describe('ConflictError', () => {
      it('should handle conflict error', () => {
        // Arrange
        const error = ConflictError.duplicate({
          identifier: TEST_CONSTANTS.errorTestData.identifiers.userId,
          resource: TEST_CONSTANTS.errorTestData.resources.user,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.CONFLICT)
        expect(result.response.name).toBe('ConflictError')
        expect(result.response.code).toBe(ERROR_CODES.CONFLICT_ERROR)
      })
    })

    describe('BusinessRuleError', () => {
      it('should handle business rule error', () => {
        // Arrange
        const error = BusinessRuleError.create({
          message: TEST_CONSTANTS.errors.businessRuleViolation,
          rule: TEST_CONSTANTS.errorTestData.rules.businessRule,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        expect(result.response.name).toBe('BusinessRuleError')
        expect(result.response.code).toBe(ERROR_CODES.BUSINESS_RULE_ERROR)
      })
    })

    describe('ExternalServiceError', () => {
      it('should handle external service error', () => {
        // Arrange
        const error = ExternalServiceError.create({
          message: TEST_CONSTANTS.errors.externalServiceFailed,
          service: TEST_CONSTANTS.errorTestData.services.paymentService,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.BAD_GATEWAY)
        expect(result.response.name).toBe('ExternalServiceError')
        expect(result.response.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR)
        expect(result.response.severity).toBe(ERROR_SEVERITY.HIGH)
      })

      it('should log external service error with error level', () => {
        // Arrange
        const error = ExternalServiceError.create({
          message: TEST_CONSTANTS.errors.externalServiceFailed,
        })

        // Act
        errorHandler.handle({ error })

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith({
          context: expect.objectContaining({
            severity: ERROR_SEVERITY.HIGH,
          }),
          message: TEST_CONSTANTS.errors.externalServiceFailed,
        })
      })
    })
  })

  describe('handle - non-operational errors', () => {
    describe('InternalError', () => {
      it('should handle internal error with sanitized response', () => {
        // Arrange
        const originalError = new Error(TEST_CONSTANTS.errorTestData.handler.originalError)
        const error = InternalError.fromError({ error: originalError })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        expect(result.response.name).toBe('InternalError')
        expect(result.response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
        expect(result.response.code).toBe(ERROR_CODES.INTERNAL_ERROR)
        expect(result.response.category).toBe(ERROR_CATEGORY.INTERNAL)
        expect(result.response.severity).toBe(ERROR_SEVERITY.CRITICAL)
        expect(result.response.metadata).toBeUndefined()
      })

      it('should log internal error with error level', () => {
        // Arrange
        const error = InternalError.create({
          message: TEST_CONSTANTS.errors.internalServerError,
        })

        // Act
        errorHandler.handle({ error })

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith({
          context: expect.objectContaining({
            isOperational: false,
            severity: ERROR_SEVERITY.CRITICAL,
          }),
          message: TEST_CONSTANTS.errors.internalServerError,
        })
      })

      it('should log additional warning for non-operational errors', () => {
        // Arrange
        const error = InternalError.create({
          message: TEST_CONSTANTS.errors.internalServerError,
        })

        // Act
        errorHandler.handle({ error })

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith({
          context: {
            code: ERROR_CODES.INTERNAL_ERROR,
            errorName: 'InternalError',
          },
          message: 'Non-operational error detected - possible programming error',
        })
      })

      it('should hide internal details from response', () => {
        // Arrange
        const originalError = new Error('Database connection failed at line 42')
        const error = InternalError.fromError({
          context: 'database-service',
          error: originalError,
        })

        // Act
        const result = errorHandler.handle({ error })

        // Assert
        expect(result.response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
        expect(JSON.stringify(result.response)).not.toContain('Database connection')
        expect(JSON.stringify(result.response)).not.toContain('line 42')
        expect(JSON.stringify(result.response)).not.toContain('database-service')
      })
    })
  })

  describe('handle - unknown errors', () => {
    it('should convert ZodError to ValidationError with 400 status', () => {
      // Arrange
      const schema = z.object({
        email: z.string().min(1),
        password: z.string().min(8),
      })

      const invalidData = {
        email: TEST_CONSTANTS.emails.empty,
        password: TEST_CONSTANTS.passwords.short,
      }

      // Act
      let error: unknown
      try {
        schema.parse(invalidData)
      } catch (err) {
        error = err
      }

      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(result.response.name).toBe('ValidationError')
      expect(result.response.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(result.response.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(result.response.message).toBe('Invalid request data')
    })

    it('should convert standard Error to InternalError', () => {
      // Arrange
      const error = new Error(TEST_CONSTANTS.errors.testError)

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(result.response.name).toBe('InternalError')
      expect(result.response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
      expect(result.response.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })

    it('should convert string error to InternalError', () => {
      // Arrange
      const error = 'Something went wrong'

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(result.response.name).toBe('InternalError')
      expect(result.response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
    })

    it('should convert null error to InternalError', () => {
      // Arrange
      const error = null

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(result.response.name).toBe('InternalError')
    })

    it('should convert undefined error to InternalError', () => {
      // Arrange
      const error = undefined

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(result.response.name).toBe('InternalError')
    })

    it('should convert object without error properties to InternalError', () => {
      // Arrange
      const error = { baz: 123, foo: 'bar' }

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(result.response.name).toBe('InternalError')
      expect(result.response.message).toBe(TEST_CONSTANTS.errorTestData.handler.unexpectedError)
    })
  })

  describe('logging context', () => {
    it('should include timestamp in log context', () => {
      // Arrange
      const error = ValidationError.create({
        message: TEST_CONSTANTS.errors.validationFailed,
      })

      // Act
      errorHandler.handle({ error })

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith({
        context: expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        }),
        message: TEST_CONSTANTS.errors.validationFailed,
      })
    })

    it('should include metadata in log context when present', () => {
      // Arrange
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = ValidationError.create({
        message: TEST_CONSTANTS.errors.validationFailed,
        metadata,
      })

      // Act
      errorHandler.handle({ error })

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith({
        context: expect.objectContaining({
          metadata,
        }),
        message: TEST_CONSTANTS.errors.validationFailed,
      })
    })

    it('should not include metadata in log context when absent', () => {
      // Arrange
      const error = ValidationError.create({
        message: TEST_CONSTANTS.errors.validationFailed,
      })

      // Act
      errorHandler.handle({ error })

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith({
        context: expect.not.objectContaining({
          metadata: expect.anything(),
        }),
        message: TEST_CONSTANTS.errors.validationFailed,
      })
    })
  })

  describe('timestamp handling', () => {
    it('should include formatted timestamp in response', () => {
      // Arrange
      const error = ValidationError.create({
        message: TEST_CONSTANTS.errors.validationFailed,
      })

      // Act
      const result = errorHandler.handle({ error })

      // Assert
      expect(result.response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(() => new Date(result.response.timestamp)).not.toThrow()
    })
  })
})
