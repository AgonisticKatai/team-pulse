import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '@team-pulse/shared/errors'
import type { ILogger } from '@team-pulse/shared/errors/handler'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import type { FastifyReply } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleError } from './error-handler.js'

describe('FastifyErrorHandler', () => {
  let mockReply: FastifyReply
  let mockLogger: ILogger

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    } as unknown as ILogger

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply
  })

  describe('handleError', () => {
    it('should handle ValidationError with 400 status', () => {
      // Arrange
      const error = ValidationError.forField({
        field: TEST_CONSTANTS.errorTestData.fields.email,
        message: TEST_CONSTANTS.errors.validationFailed,
      })

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.badRequest)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: error.code,
          message: error.message,
        },
        success: false,
      })
    })

    it('should handle AuthenticationError with 401 status', () => {
      // Arrange
      const error = AuthenticationError.invalidCredentials()

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.unauthorized)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: error.code,
          message: error.message,
        },
        success: false,
      })
    })

    it('should handle NotFoundError with 404 status', () => {
      // Arrange
      const error = NotFoundError.forResource({
        identifier: TEST_CONSTANTS.errorTestData.identifiers.userId,
        resource: TEST_CONSTANTS.errorTestData.resources.user,
      })

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.notFound)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: error.code,
          message: error.message,
        },
        success: false,
      })
    })

    it('should handle ConflictError with 409 status', () => {
      // Arrange
      const error = ConflictError.duplicate({
        identifier: TEST_CONSTANTS.testEmails.first,
        resource: TEST_CONSTANTS.errorTestData.resources.user,
      })

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.conflict)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: error.code,
          message: error.message,
        },
        success: false,
      })
    })

    it('should handle unknown error with 500 status', () => {
      // Arrange
      const error = new Error(TEST_CONSTANTS.errorTestData.handler.unexpectedError)

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.internalServerError)
      expect(mockReply.send).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: TEST_CONSTANTS.errorTestData.handler.unexpectedError,
        },
        success: false,
      })
    })

    it('should log error with appropriate level', () => {
      // Arrange
      const error = ValidationError.forField({
        field: TEST_CONSTANTS.errorTestData.fields.email,
        message: TEST_CONSTANTS.errors.validationFailed,
      })

      // Act
      handleError({ error, reply: mockReply, logger: mockLogger })

      // Assert - ValidationError has LOW severity, should log as info
      expect(mockLogger.info).toHaveBeenCalled()
    })
  })
})
