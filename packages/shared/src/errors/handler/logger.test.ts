/**
 * Logger Tests
 *
 * Tests for logger interface and implementations
 */

import { ERROR_SEVERITY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsoleLogger, getLogLevelForSeverity, NoOpLogger, SEVERITY_TO_LOG_LEVEL } from './logger.js'

const NO_OP = () => {
  /* no-op */
}

describe('logger', () => {
  describe('SEVERITY_TO_LOG_LEVEL', () => {
    it('should map low severity to info', () => {
      // Assert
      expect(SEVERITY_TO_LOG_LEVEL[ERROR_SEVERITY.LOW]).toBe('info')
    })

    it('should map medium severity to warn', () => {
      // Assert
      expect(SEVERITY_TO_LOG_LEVEL[ERROR_SEVERITY.MEDIUM]).toBe('warn')
    })

    it('should map high severity to error', () => {
      // Assert
      expect(SEVERITY_TO_LOG_LEVEL[ERROR_SEVERITY.HIGH]).toBe('error')
    })

    it('should map critical severity to error', () => {
      // Assert
      expect(SEVERITY_TO_LOG_LEVEL[ERROR_SEVERITY.CRITICAL]).toBe('error')
    })
  })

  describe('getLogLevelForSeverity', () => {
    it('should return info for low severity', () => {
      // Act
      const level = getLogLevelForSeverity({ severity: ERROR_SEVERITY.LOW })

      // Assert
      expect(level).toBe('info')
    })

    it('should return warn for medium severity', () => {
      // Act
      const level = getLogLevelForSeverity({ severity: ERROR_SEVERITY.MEDIUM })

      // Assert
      expect(level).toBe('warn')
    })

    it('should return error for high severity', () => {
      // Act
      const level = getLogLevelForSeverity({ severity: ERROR_SEVERITY.HIGH })

      // Assert
      expect(level).toBe('error')
    })

    it('should return error for critical severity', () => {
      // Act
      const level = getLogLevelForSeverity({ severity: ERROR_SEVERITY.CRITICAL })

      // Assert
      expect(level).toBe('error')
    })
  })

  describe('ConsoleLogger', () => {
    let logger: ConsoleLogger

    beforeEach(() => {
      logger = new ConsoleLogger()
      vi.spyOn(console, 'error').mockImplementation(NO_OP)
      vi.spyOn(console, 'warn').mockImplementation(NO_OP)
      vi.spyOn(console, 'info').mockImplementation(NO_OP)
      vi.spyOn(console, 'debug').mockImplementation(NO_OP)
    })

    describe('error', () => {
      it('should log error message without context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.errorLogged

        // Act
        logger.error({ message })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.error
        expect(console.error).toHaveBeenCalledWith(message, {})
      })

      it('should log error message with context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.errorLogged
        const context = { errorCode: ERROR_SEVERITY.CRITICAL }

        // Act
        logger.error({ message, context })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.error
        expect(console.error).toHaveBeenCalledWith(message, context)
      })
    })

    describe('warn', () => {
      it('should log warning message without context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.warningLogged

        // Act
        logger.warn({ message })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.warn
        expect(console.warn).toHaveBeenCalledWith(message, {})
      })

      it('should log warning message with context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.warningLogged
        const context = { severity: ERROR_SEVERITY.MEDIUM }

        // Act
        logger.warn({ message, context })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.warn
        expect(console.warn).toHaveBeenCalledWith(message, context)
      })
    })

    describe('info', () => {
      it('should log info message without context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.infoLogged

        // Act
        logger.info({ message })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.info
        expect(console.info).toHaveBeenCalledWith(message, {})
      })

      it('should log info message with context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.infoLogged
        const context = { severity: ERROR_SEVERITY.LOW }

        // Act
        logger.info({ message, context })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.info
        expect(console.info).toHaveBeenCalledWith(message, context)
      })
    })

    describe('debug', () => {
      it('should log debug message without context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.debugLogged

        // Act
        logger.debug({ message })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.debug
        expect(console.debug).toHaveBeenCalledWith(message, {})
      })

      it('should log debug message with context', () => {
        // Arrange
        const message = TEST_CONSTANTS.errorTestData.handler.logMessages.debugLogged
        const context = { requestId: TEST_CONSTANTS.errorTestData.identifiers.identifier }

        // Act
        logger.debug({ message, context })

        // Assert
        // biome-ignore lint/suspicious/noConsole: Testing ConsoleLogger calls console.debug
        expect(console.debug).toHaveBeenCalledWith(message, context)
      })
    })
  })

  describe('NoOpLogger', () => {
    let logger: NoOpLogger

    beforeEach(() => {
      logger = new NoOpLogger()
      vi.clearAllMocks()
      vi.spyOn(console, 'error')
      vi.spyOn(console, 'warn')
      vi.spyOn(console, 'info')
      vi.spyOn(console, 'debug')
    })

    it('should not log error messages', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.errorLogged
      const context = { test: 'context' }

      // Act
      logger.error({ message, context })

      // Assert
      // biome-ignore lint/suspicious/noConsole: Testing NoOpLogger does not call console.error
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should not log warning messages', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.warningLogged
      const context = { test: 'context' }

      // Act
      logger.warn({ message, context })

      // Assert
      // biome-ignore lint/suspicious/noConsole: Testing NoOpLogger does not call console.warn
      expect(console.warn).not.toHaveBeenCalled()
    })

    it('should not log info messages', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.infoLogged
      const context = { test: 'context' }

      // Act
      logger.info({ message, context })

      // Assert
      // biome-ignore lint/suspicious/noConsole: Testing NoOpLogger does not call console.info
      expect(console.info).not.toHaveBeenCalled()
    })

    it('should not log debug messages', () => {
      // Arrange
      const message = TEST_CONSTANTS.errorTestData.handler.logMessages.debugLogged
      const context = { test: 'context' }

      // Act
      logger.debug({ message, context })

      // Assert
      // biome-ignore lint/suspicious/noConsole: Testing NoOpLogger does not call console.debug
      expect(console.debug).not.toHaveBeenCalled()
    })
  })
})
