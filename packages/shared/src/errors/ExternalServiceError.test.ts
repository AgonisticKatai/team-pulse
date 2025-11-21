import { describe, expect, it } from 'vitest'
import { ExternalServiceError } from './ExternalServiceError'

describe('ExternalServiceError', () => {
  describe('Factory Methods', () => {
    it('should create external service error', () => {
      // Act
      const error = ExternalServiceError.create({
        service: 'PaymentGateway',
        message: 'Payment processing failed',
      })

      // Assert
      expect(error.message).toBe('Payment processing failed')
      expect(error.metadata.service).toBe('PaymentGateway')
    })

    it('should create timeout error', () => {
      // Act
      const error = ExternalServiceError.timeout({ service: 'EmailService' })

      // Assert
      expect(error.message).toBe('EmailService request timed out')
      expect(error.metadata.service).toBe('EmailService')
    })

    it('should create unavailable error', () => {
      // Act
      const error = ExternalServiceError.unavailable({ service: 'EmailService' })

      // Assert
      expect(error.message).toBe('EmailService is currently unavailable')
      expect(error.metadata.service).toBe('EmailService')
    })

    it('should preserve cause error', () => {
      // Arrange
      const cause = new Error('Network timeout')

      // Act
      const error = ExternalServiceError.create({
        service: 'API',
        message: 'Failed to connect',
        cause,
      })

      // Assert
      expect(error.cause).toBe(cause)
    })
  })

  describe('Properties', () => {
    it('should have external category', () => {
      // Act
      const error = ExternalServiceError.create({ service: 'API', message: 'Test' })

      // Assert
      expect(error.category).toBe(ExternalServiceError.CATEGORY)
    })

    it('should have high severity', () => {
      // Act
      const error = ExternalServiceError.create({ service: 'API', message: 'Test' })

      // Assert
      expect(error.severity).toBe('high')
    })

    it('should be operational', () => {
      // Act
      const error = ExternalServiceError.create({ service: 'API', message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = ExternalServiceError.create({ service: 'API', message: 'Test' })

      // Assert
      expect(error.code).toBe(ExternalServiceError.CODE)
    })
  })
})
