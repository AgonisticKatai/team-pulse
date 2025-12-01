/**
 * NotFoundError Tests
 *
 * Tests for NotFoundError domain error class
 */

import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { NotFoundError } from '@errors/NotFoundError.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('NotFoundError', () => {
  describe('create', () => {
    it('should create not found error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceNotFound
      const metadata = { resourceId: TEST_CONSTANTS.errorTestData.identifiers.userId }

      // Act
      const error = NotFoundError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.NOT_FOUND)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create not found error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceNotFound

      // Act
      const error = NotFoundError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('forResource', () => {
    it('should create error for specific resource with identifier', () => {
      // Arrange
      const resource = TEST_CONSTANTS.errorTestData.resources.user
      const identifier = TEST_CONSTANTS.errorTestData.identifiers.userId

      // Act
      const error = NotFoundError.forResource({ identifier, resource })

      // Assert
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe(`${resource} not found`)
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.NOT_FOUND)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        identifier,
        resource,
      })
    })

    it('should create error for team resource', () => {
      // Arrange
      const resource = TEST_CONSTANTS.errorTestData.resources.team
      const identifier = TEST_CONSTANTS.errorTestData.identifiers.teamId

      // Act
      const error = NotFoundError.forResource({ identifier, resource })

      // Assert
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe(`${resource} not found`)
      expect(error.metadata).toEqual({
        identifier,
        resource,
      })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = NotFoundError.create({ message: TEST_CONSTANTS.errors.resourceNotFound })

      // Assert
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = NotFoundError.create({ message: TEST_CONSTANTS.errors.resourceNotFound })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.NOT_FOUND)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = NotFoundError.create({ message: TEST_CONSTANTS.errors.resourceNotFound })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = NotFoundError.create({ message: TEST_CONSTANTS.errors.resourceNotFound })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name NotFoundError', () => {
      // Arrange & Act
      const error = NotFoundError.create({ message: TEST_CONSTANTS.errors.resourceNotFound })

      // Assert
      expect(error.name).toBe('NotFoundError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceNotFound
      const metadata = { resourceId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = NotFoundError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        category: ERROR_CATEGORY.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND_ERROR,
        isOperational: true,
        message,
        metadata,
        name: 'NotFoundError',
        severity: ERROR_SEVERITY.LOW,
        timestamp: error.timestamp.toISOString(),
      })
    })
  })
})
