/**
 * ConflictError Tests
 *
 * Tests for ConflictError domain error class
 */

import { ConflictError } from '@errors/ConflictError.js'
import { ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'

describe('ConflictError', () => {
  describe('create', () => {
    it('should create conflict error with message and metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceAlreadyExists
      const metadata = { resourceId: TEST_CONSTANTS.errorTestData.identifiers.userId }

      // Act
      const error = ConflictError.create({ message, metadata })

      // Assert
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe(message)
      expect(error.code).toBe(ERROR_CODES.CONFLICT_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.CONFLICT)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual(metadata)
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('should create conflict error without metadata', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceAlreadyExists

      // Act
      const error = ConflictError.create({ message })

      // Assert
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe(message)
      expect(error.metadata).toBeUndefined()
    })
  })

  describe('duplicate', () => {
    it('should create error for duplicate resource', () => {
      // Arrange
      const resource = TEST_CONSTANTS.errorTestData.resources.user
      const identifier = TEST_CONSTANTS.errorTestData.identifiers.userId

      // Act
      const error = ConflictError.duplicate({ resource, identifier })

      // Assert
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe(`${resource} already exists`)
      expect(error.code).toBe(ERROR_CODES.CONFLICT_ERROR)
      expect(error.category).toBe(ERROR_CATEGORY.CONFLICT)
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
      expect(error.isOperational).toBe(true)
      expect(error.metadata).toEqual({
        resource,
        identifier,
        reason: 'duplicate',
      })
    })

    it('should create error for duplicate team', () => {
      // Arrange
      const resource = TEST_CONSTANTS.errorTestData.resources.team
      const identifier = TEST_CONSTANTS.errorTestData.identifiers.teamId

      // Act
      const error = ConflictError.duplicate({ resource, identifier })

      // Assert
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe(`${resource} already exists`)
      expect(error.metadata).toEqual({
        resource,
        identifier,
        reason: 'duplicate',
      })
    })
  })

  describe('error properties', () => {
    it('should have correct code', () => {
      // Arrange & Act
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })

      // Assert
      expect(error.code).toBe(ERROR_CODES.CONFLICT_ERROR)
    })

    it('should have correct category', () => {
      // Arrange & Act
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })

      // Assert
      expect(error.category).toBe(ERROR_CATEGORY.CONFLICT)
    })

    it('should have correct severity', () => {
      // Arrange & Act
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })

      // Assert
      expect(error.severity).toBe(ERROR_SEVERITY.LOW)
    })

    it('should be operational', () => {
      // Arrange & Act
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name ConflictError', () => {
      // Arrange & Act
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })

      // Assert
      expect(error.name).toBe('ConflictError')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      // Arrange
      const message = TEST_CONSTANTS.errors.resourceAlreadyExists
      const metadata = { resourceId: TEST_CONSTANTS.errorTestData.identifiers.userId }
      const error = ConflictError.create({ message, metadata })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toEqual({
        name: 'ConflictError',
        message,
        code: ERROR_CODES.CONFLICT_ERROR,
        category: ERROR_CATEGORY.CONFLICT,
        severity: ERROR_SEVERITY.LOW,
        timestamp: error.timestamp.toISOString(),
        isOperational: true,
        metadata,
      })
    })
  })

  describe('withContext', () => {
    it('should add context to error', () => {
      // Arrange
      const error = ConflictError.create({ message: TEST_CONSTANTS.errors.resourceAlreadyExists })
      const context = { [TEST_CONSTANTS.errorTestData.context.operation]: TEST_CONSTANTS.errorTestData.context.module }

      // Act
      const errorWithContext = error.withContext({ ctx: context })

      // Assert
      expect(errorWithContext).toBeInstanceOf(ConflictError)
      expect(errorWithContext.metadata).toEqual(context)
    })
  })
})
