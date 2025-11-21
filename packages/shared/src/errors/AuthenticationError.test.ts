import { describe, expect, it } from 'vitest'
import { AuthenticationError } from './AuthenticationError'

describe('AuthenticationError', () => {
  describe('Factory Methods', () => {
    it('should create generic authentication error', () => {
      // Act
      const error = AuthenticationError.create({ message: 'Auth failed' })

      // Assert
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe('Auth failed')
    })

    it('should create invalid credentials error', () => {
      // Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error.message).toBe('Invalid credentials')
      expect(error.metadata.reason).toBe('invalid_credentials')
    })

    it('should create invalid token error', () => {
      // Act
      const error = AuthenticationError.invalidToken()

      // Assert
      expect(error.message).toBe('Invalid or expired token')
      expect(error.metadata.reason).toBe('invalid_token')
    })

    it('should create invalid token error with reason', () => {
      // Act
      const error = AuthenticationError.invalidToken({ reason: 'expired' })

      // Assert
      expect(error.message).toBe('Invalid or expired token')
      expect(error.metadata.reason).toBe('expired')
    })

    it('should create missing token error', () => {
      // Act
      const error = AuthenticationError.missingToken()

      // Assert
      expect(error.message).toBe('Missing authentication token')
      expect(error.metadata.reason).toBe('missing_token')
    })

    it('should create invalid refresh token error', () => {
      // Act
      const error = AuthenticationError.invalidRefreshToken()

      // Assert
      expect(error.message).toBe('Invalid or expired refresh token')
      expect(error.metadata.reason).toBe('invalid_refresh_token')
    })
  })

  describe('Properties', () => {
    it('should have authentication category', () => {
      // Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error.category).toBe(AuthenticationError.CATEGORY)
    })

    it('should have medium severity', () => {
      // Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error.severity).toBe('medium')
    })

    it('should be operational', () => {
      // Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = AuthenticationError.invalidCredentials()

      // Assert
      expect(error.code).toBe(AuthenticationError.CODE)
    })
  })
})
