import type { ILogger } from '@team-pulse/shared/handler'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import type { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FastifyLogger } from './FastifyLogger.js'

describe('FastifyLogger', () => {
  let mockFastifyLogger: FastifyBaseLogger
  let logger: ILogger

  beforeEach(() => {
    // Mock Fastify logger
    mockFastifyLogger = {
      child: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
      level: 'info',
      silent: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
    } as unknown as FastifyBaseLogger

    logger = FastifyLogger.create({ logger: mockFastifyLogger })
  })

  describe('create', () => {
    it('should create FastifyLogger instance', () => {
      // Arrange & Act
      const result = FastifyLogger.create({ logger: mockFastifyLogger })

      // Assert
      expect(result).toBeInstanceOf(FastifyLogger)
    })
  })

  describe('error', () => {
    it('should log error message without context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.errorLogged

      // Act
      logger.error({ message })

      // Assert
      expect(mockFastifyLogger.error).toHaveBeenCalledWith({ context: {} }, message)
    })

    it('should log error message with context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.errorLogged
      const context = {
        operation: TEST_CONSTANTS.errorTestData.handler.logContext.operation,
        userId: TEST_CONSTANTS.errorTestData.handler.logContext.userId,
      }

      // Act
      logger.error({ context, message })

      // Assert
      expect(mockFastifyLogger.error).toHaveBeenCalledWith({ context }, message)
    })
  })

  describe('warn', () => {
    it('should log warning message without context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.warningLogged

      // Act
      logger.warn({ message })

      // Assert
      expect(mockFastifyLogger.warn).toHaveBeenCalledWith({ context: {} }, message)
    })

    it('should log warning message with context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.warningLogged
      const context = {
        endpoint: TEST_CONSTANTS.errorTestData.handler.logContext.endpoint,
        retries: TEST_CONSTANTS.errorTestData.handler.logContext.retries,
      }

      // Act
      logger.warn({ context, message })

      // Assert
      expect(mockFastifyLogger.warn).toHaveBeenCalledWith({ context }, message)
    })
  })

  describe('info', () => {
    it('should log info message without context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.infoLogged

      // Act
      logger.info({ message })

      // Assert
      expect(mockFastifyLogger.info).toHaveBeenCalledWith({ context: {} }, message)
    })

    it('should log info message with context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.infoLogged
      const context = {
        action: TEST_CONSTANTS.errorTestData.handler.logContext.action,
        userId: TEST_CONSTANTS.errorTestData.handler.logContext.userId,
      }

      // Act
      logger.info({ context, message })

      // Assert
      expect(mockFastifyLogger.info).toHaveBeenCalledWith({ context }, message)
    })
  })

  describe('debug', () => {
    it('should log debug message without context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.debugLogged

      // Act
      logger.debug({ message })

      // Assert
      expect(mockFastifyLogger.debug).toHaveBeenCalledWith({ context: {} }, message)
    })

    it('should log debug message with context', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.debugLogged
      const context = {
        duration: TEST_CONSTANTS.errorTestData.handler.logContext.duration,
        requestId: TEST_CONSTANTS.errorTestData.handler.logContext.requestId,
      }

      // Act
      logger.debug({ context, message })

      // Assert
      expect(mockFastifyLogger.debug).toHaveBeenCalledWith({ context }, message)
    })
  })
})
