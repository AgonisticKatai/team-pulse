/**
 * Core Error System Tests
 *
 * Tests for ERROR_SEVERITY, ERROR_CATEGORY, ERROR_CODES constants,
 * ApplicationError base class, and type guards
 */

import type { ErrorCategory, ErrorCode, ErrorSeverity } from '@errors/core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY, isApplicationError, isIApplicationError } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

/**
 * Concrete implementation of ApplicationError for testing purposes
 */
class TestApplicationError extends ApplicationError {
  readonly code: ErrorCode = ERROR_CODES.VALIDATION_ERROR
  readonly category: ErrorCategory = ERROR_CATEGORY.VALIDATION

  constructor({
    message,
    severity,
    metadata,
    isOperational = true,
  }: {
    message: string
    severity?: ErrorSeverity
    metadata?: Record<string, unknown>
    isOperational?: boolean
  }) {
    super({
      message,
      severity: severity ?? ERROR_SEVERITY.LOW,
      metadata,
      isOperational,
    })
  }
}

describe('ERROR_SEVERITY', () => {
  it('should have LOW severity', () => {
    // Arrange & Act & Assert
    expect(ERROR_SEVERITY.LOW).toBe('low')
  })

  it('should have MEDIUM severity', () => {
    // Arrange & Act & Assert
    expect(ERROR_SEVERITY.MEDIUM).toBe('medium')
  })

  it('should have HIGH severity', () => {
    // Arrange & Act & Assert
    expect(ERROR_SEVERITY.HIGH).toBe('high')
  })

  it('should have CRITICAL severity', () => {
    // Arrange & Act & Assert
    expect(ERROR_SEVERITY.CRITICAL).toBe('critical')
  })
})

describe('ERROR_CATEGORY', () => {
  it('should have VALIDATION category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.VALIDATION).toBe('validation')
  })

  it('should have AUTHENTICATION category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.AUTHENTICATION).toBe('authentication')
  })

  it('should have AUTHORIZATION category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.AUTHORIZATION).toBe('authorization')
  })

  it('should have NOT_FOUND category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.NOT_FOUND).toBe('not_found')
  })

  it('should have CONFLICT category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.CONFLICT).toBe('conflict')
  })

  it('should have BUSINESS_RULE category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.BUSINESS_RULE).toBe('business_rule')
  })

  it('should have EXTERNAL category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.EXTERNAL).toBe('external')
  })

  it('should have INTERNAL category', () => {
    // Arrange & Act & Assert
    expect(ERROR_CATEGORY.INTERNAL).toBe('internal')
  })
})

describe('ERROR_CODES', () => {
  it('should have VALIDATION_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
  })

  it('should have AUTHENTICATION_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR')
  })

  it('should have AUTHORIZATION_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.AUTHORIZATION_ERROR).toBe('AUTHORIZATION_ERROR')
  })

  it('should have NOT_FOUND_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.NOT_FOUND_ERROR).toBe('NOT_FOUND_ERROR')
  })

  it('should have CONFLICT_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.CONFLICT_ERROR).toBe('CONFLICT_ERROR')
  })

  it('should have BUSINESS_RULE_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.BUSINESS_RULE_ERROR).toBe('BUSINESS_RULE_ERROR')
  })

  it('should have EXTERNAL_SERVICE_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR')
  })

  it('should have INTERNAL_ERROR code', () => {
    // Arrange & Act & Assert
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
  })
})

describe('ApplicationError', () => {
  describe('constructor', () => {
    it('should create error with all required properties', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.testError
      const severity = ERROR_SEVERITY.MEDIUM
      const metadata = { [TEST_CONSTANTS.errorTestData.fields.field]: TEST_CONSTANTS.errorTestData.fields.email }

      // Act
      const error = new TestApplicationError({
        message,
        severity,
        metadata,
      })

      // Assert
      expect(error.message).toBe(message)
      expect(error.severity).toBe(severity)
      expect(error.metadata).toEqual(metadata)
      expect(error.isOperational).toBe(true)
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.VALIDATION)
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.name).toBe('TestApplicationError')
      expect(error.stack).toBeDefined()
    })

    it('should create error with default timestamp', () => {
      // Arrange
      const beforeCreation = new Date()

      // Act
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })
      const afterCreation = new Date()

      // Assert
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should create error with custom timestamp', () => {
      // Arrange
      const customTimestamp = TEST_CONSTANTS.pastDate

      // Act
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
        severity: ERROR_SEVERITY.LOW,
        metadata: { timestamp: customTimestamp },
      })

      // Assert
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create error without metadata', () => {
      // Arrange & Act
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })

      // Assert
      expect(error.metadata).toBeUndefined()
    })

    it('should create non-operational error', () => {
      // Arrange & Act
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.internalServerError,
        isOperational: false,
      })

      // Assert
      expect(error.isOperational).toBe(false)
    })

    it('should capture stack trace', () => {
      // Arrange & Act
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('TestApplicationError')
    })
  })

  describe('withContext', () => {
    it('should return new instance with merged metadata', () => {
      // Arrange
      const originalMetadata = { [TEST_CONSTANTS.errorTestData.fields.field]: TEST_CONSTANTS.errorTestData.fields.email }
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
        metadata: originalMetadata,
      })
      const additionalContext = {
        [TEST_CONSTANTS.errorTestData.context.operation]: TEST_CONSTANTS.errorTestData.context.module,
      }

      // Act
      const errorWithContext = error.withContext({ ctx: additionalContext })

      // Assert
      expect(errorWithContext).toBeInstanceOf(TestApplicationError)
      expect(errorWithContext).not.toBe(error) // Should be a new instance
      expect(errorWithContext.metadata).toEqual({
        ...originalMetadata,
        ...additionalContext,
      })
      expect(errorWithContext.message).toBe(error.message)
      expect(errorWithContext.severity).toBe(error.severity)
    })

    it('should create metadata when original error has none', () => {
      // Arrange
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })
      const context = {
        [TEST_CONSTANTS.errorTestData.context.operation]: TEST_CONSTANTS.errorTestData.context.module,
      }

      // Act
      const errorWithContext = error.withContext({ ctx: context })

      // Assert
      expect(errorWithContext.metadata).toEqual(context)
    })

    it('should override metadata properties with same key', () => {
      // Arrange
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
        metadata: { key: 'original' },
      })

      // Act
      const errorWithContext = error.withContext({ ctx: { key: 'updated' } })

      // Assert
      expect(errorWithContext.metadata).toEqual({ key: 'updated' })
    })
  })

  describe('toJSON', () => {
    it('should serialize error to JSON with all properties', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.testError
      const severity = ERROR_SEVERITY.HIGH
      const metadata = {
        [TEST_CONSTANTS.errorTestData.fields.field]: TEST_CONSTANTS.errorTestData.fields.email,
      }
      const error = new TestApplicationError({
        message,
        severity,
        metadata,
      })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'TestApplicationError',
        message,
        code: ERROR_CODES.VALIDATION_ERROR,
        category: ERROR_CATEGORY.VALIDATION,
        severity,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata,
      })
    })

    it('should serialize error without metadata', () => {
      // Arrange
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'TestApplicationError',
        message: TEST_CONSTANTS.errors.testError,
        code: ERROR_CODES.VALIDATION_ERROR,
        category: ERROR_CATEGORY.VALIDATION,
        severity: ERROR_SEVERITY.LOW,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
      })
    })

    it('should not include stack trace in JSON output', () => {
      // Arrange
      const error = new TestApplicationError({
        message: TEST_CONSTANTS.errors.testError,
      })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).not.toHaveProperty('stack')
    })
  })
})

describe('isApplicationError', () => {
  it('should return true for ApplicationError instances', () => {
    // Arrange
    const error = new TestApplicationError({
      message: TEST_CONSTANTS.errors.testError,
    })

    // Act
    const result = isApplicationError(error)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false for standard Error instances', () => {
    // Arrange
    const error = new Error(TEST_CONSTANTS.errors.testError)

    // Act
    const result = isApplicationError(error)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for null', () => {
    // Arrange & Act
    const result = isApplicationError(null)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for undefined', () => {
    // Arrange & Act
    const result = isApplicationError(undefined)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for plain objects', () => {
    // Arrange
    const obj = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
    }

    // Act
    const result = isApplicationError(obj)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for strings', () => {
    // Arrange & Act
    const result = isApplicationError(TEST_CONSTANTS.errors.testError)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for numbers', () => {
    // Arrange & Act
    const result = isApplicationError(500)

    // Assert
    expect(result).toBe(false)
  })
})

describe('isIApplicationError', () => {
  it('should return true for objects matching IApplicationError interface', () => {
    // Arrange
    const error = new TestApplicationError({
      message: TEST_CONSTANTS.errors.testError,
    })

    // Act
    const result = isIApplicationError(error)

    // Assert
    expect(result).toBe(true)
  })

  it('should return true for plain objects with all required properties', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date(),
      isOperational: true,
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(true)
  })

  it('should return false for objects missing code property', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date(),
      isOperational: true,
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for objects missing category property', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date(),
      isOperational: true,
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for objects missing severity property', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
      category: ERROR_CATEGORY.VALIDATION,
      timestamp: new Date(),
      isOperational: true,
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for objects missing timestamp property', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.MEDIUM,
      isOperational: true,
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for objects missing isOperational property', () => {
    // Arrange
    const errorLike = {
      message: TEST_CONSTANTS.errors.testError,
      code: ERROR_CODES.VALIDATION_ERROR,
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.MEDIUM,
      timestamp: new Date(),
    }

    // Act
    const result = isIApplicationError(errorLike)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for null', () => {
    // Arrange & Act
    const result = isIApplicationError(null)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for undefined', () => {
    // Arrange & Act
    const result = isIApplicationError(undefined)

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for standard Error instances', () => {
    // Arrange
    const error = new Error(TEST_CONSTANTS.errors.testError)

    // Act
    const result = isIApplicationError(error)

    // Assert
    expect(result).toBe(false)
  })
})
