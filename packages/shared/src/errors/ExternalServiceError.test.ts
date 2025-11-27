/**
 * ExternalServiceError Tests
 *
 * Tests for ExternalServiceError domain error class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { ExternalServiceError } from '@errors/ExternalServiceError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('ExternalServiceError', () => {
  describe('create', () => {
    it('should create external service error with message, service and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.externalServiceFailed
      const service = TEST_CONSTANTS.errorTestData.services.paymentService
      const metadata = { statusCode: 503 }

      // Act
      const error = ExternalServiceError.create({ message, service, metadata })

      // Assert
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.EXTERNAL)
      expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        ...metadata,
        service,
      })
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create external service error with message only', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.externalServiceFailed

      // Act
      const error = ExternalServiceError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual({})
    })

    it('should create external service error with message and service', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.externalServiceFailed
      const service = TEST_CONSTANTS.errorTestData.services.emailService

      // Act
      const error = ExternalServiceError.create({ message, service })

      // Assert
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual({ service })
    })

    it('should create external service error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.externalServiceFailed
      const metadata = { apiUrl: 'https://api.example.com', statusCode: 500 }

      // Act
      const error = ExternalServiceError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(ExternalServiceError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual(metadata)
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = ExternalServiceError.create({ message: TEST_CONSTANTS.errors.externalServiceFailed })

      // Assert
      expect(error.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = ExternalServiceError.create({ message: TEST_CONSTANTS.errors.externalServiceFailed })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.EXTERNAL)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = ExternalServiceError.create({ message: TEST_CONSTANTS.errors.externalServiceFailed })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.HIGH)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = ExternalServiceError.create({ message: TEST_CONSTANTS.errors.externalServiceFailed })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name ExternalServiceError', () => {
      // Arrange & Act
      const error = ExternalServiceError.create({ message: TEST_CONSTANTS.errors.externalServiceFailed })

      // Assert
      expect(error.name).toBe('ExternalServiceError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.externalServiceFailed
      const service = TEST_CONSTANTS.errorTestData.services.externalApi
      const metadata = { statusCode: 502 }
      const error = ExternalServiceError.create({ message, service, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'ExternalServiceError',
        message,
        code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        category: ERROR_CATEGORY.EXTERNAL,
        severity: ERROR_SEVERITY.HIGH,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata: {
          ...metadata,
          service,
        },
      })
    })
  })
})
