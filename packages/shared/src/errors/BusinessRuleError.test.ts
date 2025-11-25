/**
 * BusinessRuleError Tests
 *
 * Tests for BusinessRuleError domain error class
 */

import { BusinessRuleError } from '@errors/BusinessRuleError.js'
import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('BusinessRuleError', () => {
  describe('create', () => {
    it('should create business rule error with message, rule and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.businessRuleViolation
      const rule = TEST_CONSTANTS.errorTestData.rules.businessRule
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }

      // Act
      const error = BusinessRuleError.create({ message, rule, metadata })

      // Assert
      expect(error).toBeInstanceOf(BusinessRuleError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.BUSINESS_RULE_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.BUSINESS_RULE)
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        ...metadata,
        rule,
      })
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create business rule error with message only', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.businessRuleViolation

      // Act
      const error = BusinessRuleError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(BusinessRuleError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual({})
    })

    it('should create business rule error with message and rule', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.businessRuleViolation
      const rule = TEST_CONSTANTS.errorTestData.rules.maxLength

      // Act
      const error = BusinessRuleError.create({ message, rule })

      // Assert
      expect(error).toBeInstanceOf(BusinessRuleError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual({ rule })
    })

    it('should create business rule error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.businessRuleViolation
      const metadata = { field: TEST_CONSTANTS.errorTestData.fields.field }

      // Act
      const error = BusinessRuleError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(BusinessRuleError)
      expect(error.message).toBe(message)
      expect(error.metadata).toEqual(metadata)
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })

      // Assert
      expect(error.code).toBe(ERROR_CODES.BUSINESS_RULE_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.BUSINESS_RULE)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.MEDIUM)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name BusinessRuleError', () => {
      // Arrange & Act
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })

      // Assert
      expect(error.name).toBe('BusinessRuleError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.businessRuleViolation
      const rule = TEST_CONSTANTS.errorTestData.rules.businessRule
      const metadata = { userId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = BusinessRuleError.create({ message, rule, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'BusinessRuleError',
        message,
        code: ERROR_CODES.BUSINESS_RULE_ERROR,
        category: ERROR_CATEGORY.BUSINESS_RULE,
        severity: ERROR_SEVERITY.MEDIUM,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata: {
          ...metadata,
          rule,
        },
      })
    })
  })

  describe('withContext', () => {
    it('should add context to error', () => {
      // Arrange
      const error = BusinessRuleError.create({ message: TEST_CONSTANTS.errors.businessRuleViolation })
      const context = { [TEST_CONSTANTS.errorTestData.context.operation]: TEST_CONSTANTS.errorTestData.context.module }

      // Act
      const errorWithContext = error.withContext({ ctx: context })

      // Assert
      expect(errorWithContext).toBeInstanceOf(BusinessRuleError)
      expect(errorWithContext.metadata).toEqual(context)
    })
  })
})
