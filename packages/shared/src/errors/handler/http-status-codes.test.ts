/**
 * HTTP Status Codes Tests
 *
 * Tests for HTTP status code mappings
 */

import { ERROR_CATEGORY } from '@errors/core.js'
import { TEST_CONSTANTS } from '@testing/constants.js'
import { describe, expect, it } from 'vitest'
import { ERROR_CATEGORY_TO_HTTP_STATUS, getHttpStatusForCategory, HTTP_STATUS } from './http-status-codes.js'

describe('http-status-codes', () => {
  describe('HTTP_STATUS', () => {
    it('should define success status codes', () => {
      // Assert
      expect(HTTP_STATUS.OK).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.ok)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
    })

    it('should define client error status codes', () => {
      // Assert
      expect(HTTP_STATUS.BAD_REQUEST).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.badRequest)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.unauthorized)
      expect(HTTP_STATUS.FORBIDDEN).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.forbidden)
      expect(HTTP_STATUS.NOT_FOUND).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.notFound)
      expect(HTTP_STATUS.CONFLICT).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.conflict)
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.unprocessableEntity)
    })

    it('should define server error status codes', () => {
      // Assert
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.internalServerError)
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(TEST_CONSTANTS.errorTestData.handler.httpStatusCodes.badGateway)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('ERROR_CATEGORY_TO_HTTP_STATUS', () => {
    it('should map validation to 400 Bad Request', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.VALIDATION]).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('should map authentication to 401 Unauthorized', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.AUTHENTICATION]).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('should map authorization to 403 Forbidden', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.AUTHORIZATION]).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it('should map not_found to 404 Not Found', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.NOT_FOUND]).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('should map conflict to 409 Conflict', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.CONFLICT]).toBe(HTTP_STATUS.CONFLICT)
    })

    it('should map business_rule to 422 Unprocessable Entity', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.BUSINESS_RULE]).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    })

    it('should map external to 502 Bad Gateway', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.EXTERNAL]).toBe(HTTP_STATUS.BAD_GATEWAY)
    })

    it('should map internal to 500 Internal Server Error', () => {
      // Assert
      expect(ERROR_CATEGORY_TO_HTTP_STATUS[ERROR_CATEGORY.INTERNAL]).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('getHttpStatusForCategory', () => {
    it('should return 400 for validation category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.VALIDATION })

      // Assert
      expect(status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('should return 401 for authentication category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.AUTHENTICATION })

      // Assert
      expect(status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('should return 403 for authorization category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.AUTHORIZATION })

      // Assert
      expect(status).toBe(HTTP_STATUS.FORBIDDEN)
    })

    it('should return 404 for not_found category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.NOT_FOUND })

      // Assert
      expect(status).toBe(HTTP_STATUS.NOT_FOUND)
    })

    it('should return 409 for conflict category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.CONFLICT })

      // Assert
      expect(status).toBe(HTTP_STATUS.CONFLICT)
    })

    it('should return 422 for business_rule category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.BUSINESS_RULE })

      // Assert
      expect(status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    })

    it('should return 502 for external category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.EXTERNAL })

      // Assert
      expect(status).toBe(HTTP_STATUS.BAD_GATEWAY)
    })

    it('should return 500 for internal category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: ERROR_CATEGORY.INTERNAL })

      // Assert
      expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })

    it('should return 500 for unknown category', () => {
      // Act
      const status = getHttpStatusForCategory({ category: 'unknown_category' })

      // Assert
      expect(status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })
})
