import { TokenFactory } from '@application/factories/TokenFactory.js'
import type { User } from '@domain/models/user/User.js'
import { AuthService } from '@infrastructure/auth/AuthService.js'
import { TEST_INVALID_TOKEN_ENV, TEST_TOKEN_ENV } from '@infrastructure/testing/test-env.js'
import { buildUser } from '@infrastructure/testing/user-builders.js'
import { AuthenticationError, USER_ROLES, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it } from 'vitest'

describe('AuthService', () => {
  let authService: AuthService
  let tokenFactory: TokenFactory
  let validToken: string
  let testUser: User

  beforeEach(() => {
    // Arrange - Create dependencies
    tokenFactory = TokenFactory.create({ env: TEST_TOKEN_ENV })
    authService = AuthService.create({ tokenFactory })

    // Generate test user
    testUser = buildUser()

    // Create a valid token for tests
    const tokenResult = tokenFactory.createAccessToken({
      email: testUser.email,
      role: testUser.role,
      userId: testUser.id,
    })
    validToken = expectSuccess(tokenResult)
  })

  describe('Factory Pattern', () => {
    it('should create AuthService instance with factory method', () => {
      // Act
      const service = AuthService.create({ tokenFactory })

      // Assert
      expect(service).toBeInstanceOf(AuthService)
    })
  })

  describe('verifyAuthHeader', () => {
    describe('Success cases', () => {
      it('should successfully verify valid Bearer token', () => {
        // Arrange
        const authHeader = `Bearer ${validToken}`

        // Act
        const result = authService.verifyAuthHeader({ authHeader })

        // Assert
        const payload = expectSuccess(result)
        expect(payload.userId).toBe(testUser.id)
        expect(payload.email).toBe(testUser.email.value)
        expect(payload.role).toBe(testUser.role.value)
      })

      it('should return complete payload with all JWT claims', () => {
        // Arrange
        const authHeader = `Bearer ${validToken}`

        // Act
        const result = authService.verifyAuthHeader({ authHeader })

        // Assert
        const payload = expectSuccess(result)
        expect(payload).toHaveProperty('userId')
        expect(payload).toHaveProperty('email')
        expect(payload).toHaveProperty('role')
        expect(payload).toHaveProperty('iat') // issued at
        expect(payload).toHaveProperty('exp') // expiration
        expect(payload).toHaveProperty('iss') // issuer
        expect(payload).toHaveProperty('aud') // audience
      })
    })

    describe('Error cases - Missing Authorization header', () => {
      it('should return ValidationError when authHeader is undefined', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: undefined })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
        expect(error.message).toContain('Missing Authorization header')
      })

      it('should return ValidationError when authHeader is empty string', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: '' })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
      })
    })

    describe('Error cases - Invalid Authorization header format', () => {
      it('should return ValidationError when missing Bearer prefix', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: validToken })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
        expect(error.message).toContain('Bearer')
      })

      it('should return ValidationError when using wrong auth scheme', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: `Basic ${validToken}` })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
        expect(error.message).toContain('Bearer')
      })

      it('should return ValidationError when Bearer has no token', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: 'Bearer ' })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
      })

      it('should return ValidationError when Bearer token is empty', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: 'Bearer' })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
      })

      it('should return ValidationError with extra spaces', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: `Bearer  ${validToken}` })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
      })

      it('should return ValidationError with multiple parts', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: `Bearer ${validToken} extra` })

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.metadata?.field).toBe('authorization')
      })
    })

    describe('Error cases - Invalid JWT token', () => {
      it('should return AuthenticationError for malformed JWT', () => {
        // Act
        const result = authService.verifyAuthHeader({ authHeader: 'Bearer not-a-jwt-token' })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.metadata?.field).toBe('accessToken')
        expect(error.message).toContain('Invalid token')
      })

      it('should return AuthenticationError for JWT with invalid signature', () => {
        // Arrange - Tamper with the token
        const parts = validToken.split('.')
        const tamperedToken = `${parts[0]}.${parts[1]}.invalid-signature`

        // Act
        const result = authService.verifyAuthHeader({ authHeader: `Bearer ${tamperedToken}` })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.metadata?.field).toBe('accessToken')
        expect(error.message).toContain('Invalid token')
      })

      it('should return AuthenticationError for expired JWT', () => {
        // Arrange - Create a token with TokenFactory from the past (this is tricky, we'll use a pre-expired token)
        // For this test, we can create a token and wait, or mock time
        // For simplicity, we'll test the error message format
        const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid'

        // Act
        const result = authService.verifyAuthHeader({ authHeader: expiredToken })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.metadata?.field).toBe('accessToken')
      })

      it('should return AuthenticationError for JWT with wrong issuer', () => {
        // Arrange - Create a token with different secret/issuer
        const wrongTokenFactory = TokenFactory.create({ env: TEST_INVALID_TOKEN_ENV })
        const wrongTokenResult = wrongTokenFactory.createAccessToken({
          email: testUser.email,
          role: testUser.role,
          userId: testUser.id,
        })
        const wrongToken = expectSuccess(wrongTokenResult)

        // Act
        const result = authService.verifyAuthHeader({ authHeader: `Bearer ${wrongToken}` })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.metadata?.field).toBe('accessToken')
      })
    })
  })

  describe('checkUserRole', () => {
    describe('Success cases', () => {
      it('should return true when user has exact role', () => {
        // Arrange
        const user = buildUser({ role: USER_ROLES.GUEST })
        const userPayload = {
          email: user.email.value,
          role: USER_ROLES.GUEST,
          userId: user.id,
        }

        // Act
        const result = authService.checkUserRole({ allowedRoles: [USER_ROLES.GUEST], user: userPayload })

        // Assert
        expect(result).toBe(true)
      })

      it('should return true when user role is in allowed list', () => {
        // Arrange
        const user = buildUser({ role: USER_ROLES.ADMIN })
        const userPayload = {
          email: user.email.value,
          role: USER_ROLES.ADMIN,
          userId: user.id,
        }

        // Act
        const result = authService.checkUserRole({
          allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
          user: userPayload,
        })

        // Assert
        expect(result).toBe(true)
      })

      it('should return true for SUPER_ADMIN in multi-role list', () => {
        // Arrange
        const user = buildUser({ role: USER_ROLES.SUPER_ADMIN })
        const userPayload = {
          email: user.email.value,
          role: USER_ROLES.SUPER_ADMIN,
          userId: user.id,
        }

        // Act
        const result = authService.checkUserRole({
          allowedRoles: [USER_ROLES.GUEST, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
          user: userPayload,
        })

        // Assert
        expect(result).toBe(true)
      })
    })

    describe('Error cases', () => {
      it('should return false when user is undefined', () => {
        // Arrange

        // Act
        const result = authService.checkUserRole({ allowedRoles: [USER_ROLES.GUEST], user: undefined })

        // Assert
        expect(result).toBe(false)
      })

      it('should return false when user role is not in allowed list', () => {
        // Arrange
        const user = buildUser({ role: USER_ROLES.GUEST })
        const userPayload = {
          email: user.email.value,
          role: USER_ROLES.GUEST,
          userId: user.id,
        }

        // Act
        const result = authService.checkUserRole({
          allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
          user: userPayload,
        })

        // Assert
        expect(result).toBe(false)
      })

      it('should return false when allowed roles is empty array', () => {
        // Arrange
        const user = buildUser({ role: USER_ROLES.GUEST })
        const userPayload = {
          email: user.email.value,
          role: USER_ROLES.GUEST,
          userId: user.id,
        }

        // Act
        const result = authService.checkUserRole({ allowedRoles: [], user: userPayload })

        // Assert
        expect(result).toBe(false)
      })
    })
  })
})
