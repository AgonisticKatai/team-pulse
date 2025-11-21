import { describe, expect, it } from 'vitest'
import { AuthorizationError } from './AuthorizationError'

describe('AuthorizationError', () => {
  describe('Factory Methods', () => {
    it('should create generic authorization error', () => {
      // Act
      const error = AuthorizationError.create({ message: 'Access denied' })

      // Assert
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe('Access denied')
    })

    it('should create insufficient permissions error', () => {
      // Act
      const error = AuthorizationError.insufficientPermissions({
        required: ['ADMIN', 'SUPER_ADMIN'],
        actual: 'USER',
      })

      // Assert
      expect(error.message).toBe('Access denied. Required role: ADMIN or SUPER_ADMIN')
      expect(error.metadata.requiredRole).toEqual(['ADMIN', 'SUPER_ADMIN'])
      expect(error.metadata.userRole).toBe('USER')
    })

    it('should create not resource owner error', () => {
      // Act
      const error = AuthorizationError.notResourceOwner({ resourceType: 'Team' })

      // Assert
      expect(error.message).toBe('You do not have permission to access this Team')
    })
  })

  describe('Properties', () => {
    it('should have authorization category', () => {
      // Act
      const error = AuthorizationError.create({ message: 'Test' })

      // Assert
      expect(error.category).toBe(AuthorizationError.CATEGORY)
    })

    it('should have medium severity', () => {
      // Act
      const error = AuthorizationError.create({ message: 'Test' })

      // Assert
      expect(error.severity).toBe('medium')
    })

    it('should be operational', () => {
      // Act
      const error = AuthorizationError.create({ message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = AuthorizationError.create({ message: 'Test' })

      // Assert
      expect(error.code).toBe(AuthorizationError.CODE)
    })
  })
})
