import { describe, expect, it } from 'vitest'
import { AuthenticationError } from './AuthenticationError.js'
import { AuthorizationError } from './AuthorizationError.js'
import { BusinessRuleError } from './BusinessRuleError.js'
import { ConflictError } from './ConflictError.js'
import { ExternalServiceError } from './ExternalServiceError.js'
import { ErrorHandler } from './error-handler.js'
import { InternalError } from './InternalError.js'
import { NotFoundError } from './NotFoundError.js'
import { ValidationError } from './ValidationError.js'

describe('ErrorHandler', () => {
  describe('toResponse', () => {
    describe('ValidationError', () => {
      it('should convert validation error to 400 response', () => {
        // Arrange
        const error = ValidationError.forField({ field: 'email', message: 'Invalid format' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid format',
            details: { field: 'email' },
          },
        })
      })

      it('should include metadata in details', () => {
        // Arrange
        const error = ValidationError.create({
          message: 'Invalid input',
          field: 'password',
          details: { min: 8, max: 20 },
        })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.body.error.details).toEqual({
          field: 'password',
          constraints: { min: 8, max: 20 },
        })
      })

      it('should not include details when metadata is empty', () => {
        // Arrange
        const error = ValidationError.create({ message: 'Invalid input' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.body.error.details).toBeUndefined()
      })
    })

    describe('AuthenticationError', () => {
      it('should convert authentication error to 401 response', () => {
        // Arrange
        const error = AuthenticationError.invalidCredentials()

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(401)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid credentials',
            details: { reason: 'invalid_credentials' },
          },
        })
      })

      it('should handle invalid token error', () => {
        // Arrange
        const error = AuthenticationError.invalidToken()

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(401)
        expect(response.body.error.message).toBe('Invalid or expired token')
      })

      it('should handle missing token error', () => {
        // Arrange
        const error = AuthenticationError.missingToken()

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(401)
        expect(response.body.error.message).toBe('Missing authentication token')
      })
    })

    describe('AuthorizationError', () => {
      it('should convert authorization error to 403 response', () => {
        // Arrange
        const error = AuthorizationError.insufficientPermissions({
          required: ['ADMIN', 'SUPER_ADMIN'],
          actual: 'USER',
        })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(403)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Access denied. Required role: ADMIN or SUPER_ADMIN',
            details: {
              requiredRole: ['ADMIN', 'SUPER_ADMIN'],
              userRole: 'USER',
            },
          },
        })
      })

      it('should handle not resource owner error', () => {
        // Arrange
        const error = AuthorizationError.notResourceOwner({ resourceType: 'Team' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(403)
        expect(response.body.error.message).toBe('You do not have permission to access this Team')
      })
    })

    describe('NotFoundError', () => {
      it('should convert not found error to 404 response', () => {
        // Arrange
        const error = NotFoundError.create({ entityName: 'User', identifier: '123' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(404)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User with identifier "123" not found',
            details: {
              entityName: 'User',
              identifier: '123',
            },
          },
        })
      })

      it('should handle not found without identifier', () => {
        // Arrange
        const error = NotFoundError.create({ entityName: 'Team' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(404)
        expect(response.body.error.message).toBe('Team not found')
      })
    })

    describe('ConflictError', () => {
      it('should convert conflict error to 409 response', () => {
        // Arrange
        const error = ConflictError.create({ entityName: 'User', identifier: 'john@example.com' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(409)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'User with identifier "john@example.com" already exists',
            details: {
              entityName: 'User',
              identifier: 'john@example.com',
            },
          },
        })
      })
    })

    describe('BusinessRuleError', () => {
      it('should convert business rule error to 422 response', () => {
        // Arrange
        const error = BusinessRuleError.create({
          rule: 'CANNOT_DELETE_TEAM_WITH_MATCHES',
          message: 'Cannot delete team with active matches',
        })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(422)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Cannot delete team with active matches',
            details: {
              rule: 'CANNOT_DELETE_TEAM_WITH_MATCHES',
            },
          },
        })
      })
    })

    describe('ExternalServiceError', () => {
      it('should convert external service error to 502 response', () => {
        // Arrange
        const error = ExternalServiceError.create({
          service: 'PaymentGateway',
          message: 'Payment processing failed',
        })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(502)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'EXTERNAL_SERVICE_ERROR',
            message: 'Payment processing failed',
            details: {
              service: 'PaymentGateway',
            },
          },
        })
      })

      it('should handle timeout errors', () => {
        // Arrange
        const error = ExternalServiceError.timeout({ service: 'EmailService' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(502)
        expect(response.body.error.message).toBe('EmailService request timed out')
      })
    })

    describe('InternalError', () => {
      it('should convert internal error to 500 response', () => {
        // Arrange
        const error = InternalError.create({ message: 'Database connection failed' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(500)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred', // Hides actual message!
          },
        })
      })

      it('should hide internal error details for security', () => {
        // Arrange
        const error = InternalError.create({ message: 'Secret database password: abc123' })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert - Details should be hidden!
        expect(response.body.error.message).toBe('An unexpected error occurred')
        expect(response.body.error.details).toBeUndefined()
      })

      it('should handle errors created from unknown errors', () => {
        // Arrange
        const originalError = new Error('Null pointer exception')
        const error = InternalError.fromUnknown({ error: originalError })

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert - Original message should be hidden!
        expect(response.statusCode).toBe(500)
        expect(response.body.error.message).toBe('An unexpected error occurred')
      })
    })

    describe('ZodError', () => {
      it('should convert Zod error to 400 response', () => {
        // Arrange
        const zodError = {
          name: 'ZodError',
          errors: [
            { path: ['user', 'email'], message: 'Invalid email' },
            { path: ['user', 'name'], message: 'Required' },
          ],
        }

        // Act
        const response = ErrorHandler.toResponse(zodError)

        // Assert
        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email',
            details: {
              field: 'user.email',
              errors: zodError.errors,
            },
          },
        })
      })

      it('should handle Zod error without path', () => {
        // Arrange
        const zodError = {
          name: 'ZodError',
          errors: [{ path: [], message: 'Invalid input' }],
        }

        // Act
        const response = ErrorHandler.toResponse(zodError)

        // Assert
        expect(response.body.error.details?.field).toBe('unknown')
      })

      it('should handle Zod error without errors array', () => {
        // Arrange
        const zodError = {
          name: 'ZodError',
          errors: [],
        }

        // Act
        const response = ErrorHandler.toResponse(zodError)

        // Assert
        expect(response.body.error.message).toBe('Validation failed')
      })
    })

    describe('Unknown Errors', () => {
      it('should convert unknown Error to 500 response', () => {
        // Arrange
        const error = new Error('Something went wrong')

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(500)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        })
      })

      it('should convert unknown non-Error to 500 response', () => {
        // Arrange
        const error = 'Something went wrong'

        // Act
        const response = ErrorHandler.toResponse(error)

        // Assert
        expect(response.statusCode).toBe(500)
        expect(response.body).toEqual({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
          },
        })
      })

      it('should handle null error', () => {
        // Act
        const response = ErrorHandler.toResponse(null)

        // Assert
        expect(response.statusCode).toBe(500)
        expect(response.body.error.code).toBe('INTERNAL_ERROR')
      })

      it('should handle undefined error', () => {
        // Act
        const response = ErrorHandler.toResponse(undefined)

        // Assert
        expect(response.statusCode).toBe(500)
        expect(response.body.error.code).toBe('INTERNAL_ERROR')
      })
    })
  })

  describe('getStatusCode', () => {
    it('should return 400 for validation category', () => {
      expect(ErrorHandler.getStatusCode('validation')).toBe(400)
    })

    it('should return 401 for authentication category', () => {
      expect(ErrorHandler.getStatusCode('authentication')).toBe(401)
    })

    it('should return 403 for authorization category', () => {
      expect(ErrorHandler.getStatusCode('authorization')).toBe(403)
    })

    it('should return 404 for not_found category', () => {
      expect(ErrorHandler.getStatusCode('not_found')).toBe(404)
    })

    it('should return 409 for conflict category', () => {
      expect(ErrorHandler.getStatusCode('conflict')).toBe(409)
    })

    it('should return 422 for business_rule category', () => {
      expect(ErrorHandler.getStatusCode('business_rule')).toBe(422)
    })

    it('should return 502 for external category', () => {
      expect(ErrorHandler.getStatusCode('external')).toBe(502)
    })

    it('should return 500 for internal category', () => {
      expect(ErrorHandler.getStatusCode('internal')).toBe(500)
    })
  })

  describe('Response Structure', () => {
    it('should always have success: false', () => {
      // Arrange
      const error = ValidationError.create({ message: 'Test' })

      // Act
      const response = ErrorHandler.toResponse(error)

      // Assert
      expect(response.body.success).toBe(false)
    })

    it('should always have error.code', () => {
      // Arrange
      const error = NotFoundError.create({ entityName: 'User' })

      // Act
      const response = ErrorHandler.toResponse(error)

      // Assert
      expect(response.body.error.code).toBeDefined()
      expect(typeof response.body.error.code).toBe('string')
    })

    it('should always have error.message', () => {
      // Arrange
      const error = AuthenticationError.invalidCredentials()

      // Act
      const response = ErrorHandler.toResponse(error)

      // Assert
      expect(response.body.error.message).toBeDefined()
      expect(typeof response.body.error.message).toBe('string')
    })

    it('should have error.details only when applicable', () => {
      // Arrange - Error with metadata
      const errorWithDetails = ValidationError.forField({ field: 'email', message: 'Invalid' })

      // Act
      const responseWithDetails = ErrorHandler.toResponse(errorWithDetails)

      // Assert
      expect(responseWithDetails.body.error.details).toBeDefined()

      // Arrange - Error without metadata
      const errorWithoutDetails = ValidationError.create({ message: 'Invalid' })

      // Act
      const responseWithoutDetails = ErrorHandler.toResponse(errorWithoutDetails)

      // Assert
      expect(responseWithoutDetails.body.error.details).toBeUndefined()
    })
  })
})
