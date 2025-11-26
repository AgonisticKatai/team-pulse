import { TokenFactory } from '@application/factories/TokenFactory.js'
import { TEST_TOKEN_ENV } from '@infrastructure/testing/test-env.js'
import { AuthenticationError } from '@team-pulse/shared/errors'
import { Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it } from 'vitest'

describe('TokenFactory', () => {
  let tokenFactory: TokenFactory

  beforeEach(() => {
    tokenFactory = TokenFactory.create({ env: TEST_TOKEN_ENV })
  })

  describe('createRefreshToken', () => {
    it('should create a valid refresh token with domain entity', () => {
      // Act
      const result = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      const refreshToken = expectSuccess(result)

      // Verify domain entity properties
      expect(refreshToken.id.getValue()).toBeDefined()
      expect(refreshToken.token).toBeDefined()
      expect(refreshToken.userId.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.id)
      expect(refreshToken.expiresAt).toBeInstanceOf(Date)
      expect(refreshToken.isExpired()).toBe(false)

      // Verify expiration is ~7 days from now
      const now = new Date()
      const expirationDiff = refreshToken.expiresAt.getTime() - now.getTime()
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      expect(expirationDiff).toBeGreaterThan(sevenDaysMs - 1000) // Allow 1s tolerance
      expect(expirationDiff).toBeLessThan(sevenDaysMs + 1000)
    })

    it('should create refresh tokens with unique IDs', () => {
      // Act
      const result1 = tokenFactory.createRefreshToken({ userId: TEST_CONSTANTS.users.johnDoe.id })
      const result2 = tokenFactory.createRefreshToken({ userId: TEST_CONSTANTS.users.johnDoe.id })

      // Assert
      const token1 = expectSuccess(result1)
      const token2 = expectSuccess(result2)

      expect(token1.id.getValue()).not.toBe(token2.id.getValue())
      expect(token1.token).not.toBe(token2.token)
    })

    it('should create verifiable refresh token JWT', () => {
      // Arrange
      const userId = TEST_CONSTANTS.users.johnDoe.id

      // Act
      const createResult = tokenFactory.createRefreshToken({ userId })
      const refreshToken = expectSuccess(createResult)

      // Verify the JWT
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: refreshToken.token,
      })

      // Assert
      const payload = expectSuccess(verifyResult)
      expect(payload.userId).toBe(userId)
      expect(payload.tokenId).toBe(refreshToken.id.getValue())
    })
  })

  describe('createAccessToken', () => {
    it('should create a valid access token', () => {
      // Act
      const result = tokenFactory.createAccessToken({
        email: TEST_CONSTANTS.users.johnDoe.email,
        role: TEST_CONSTANTS.users.johnDoe.role,
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      const token = expectSuccess(result)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should create verifiable access token with correct payload', () => {
      // Arrange
      const payload = {
        email: TEST_CONSTANTS.users.johnDoe.email,
        role: TEST_CONSTANTS.users.johnDoe.role,
        userId: TEST_CONSTANTS.users.johnDoe.id,
      }

      // Act
      const createResult = tokenFactory.createAccessToken(payload)
      const token = expectSuccess(createResult)

      // Verify the JWT
      const verifyResult = tokenFactory.verifyAccessToken({
        token,
      })

      // Assert
      const verifiedPayload = expectSuccess(verifyResult)
      expect(verifiedPayload.email).toBe(payload.email)
      expect(verifiedPayload.role).toBe(payload.role)
      expect(verifiedPayload.userId).toBe(payload.userId)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      // Arrange
      const createResult = tokenFactory.createAccessToken({
        email: TEST_CONSTANTS.users.johnDoe.email,
        role: TEST_CONSTANTS.users.johnDoe.role,
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const token = expectSuccess(createResult)

      // Act
      const verifyResult = tokenFactory.verifyAccessToken({
        token,
      })

      // Assert
      expectSuccess(verifyResult)
    })

    it('should reject invalid access token', () => {
      // Act
      const result = tokenFactory.verifyAccessToken({
        token: 'invalid-token',
      })

      // Assert
      const error = expectError(result)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.metadata?.field).toBe('accessToken')
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const createResult = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const refreshToken = expectSuccess(createResult)

      // Act
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: refreshToken.token,
      })

      // Assert
      expectSuccess(verifyResult)
    })

    it('should reject invalid refresh token', () => {
      // Act
      const result = tokenFactory.verifyRefreshToken({
        token: 'invalid-token',
      })

      // Assert
      const error = expectError(result)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.metadata?.field).toBe('refreshToken')
    })
  })

  describe('integration', () => {
    it('should work end-to-end for access tokens', () => {
      // Create token
      const createResult = tokenFactory.createAccessToken({
        email: TEST_CONSTANTS.users.adminUser.email,
        role: TEST_CONSTANTS.users.adminUser.role,
        userId: TEST_CONSTANTS.users.adminUser.id,
      })

      expect(createResult).toEqual(Ok(expect.any(String)))

      const token = expectSuccess(createResult)

      // Verify token
      const verifyResult = tokenFactory.verifyAccessToken({
        token,
      })

      expect(verifyResult).toEqual(
        Ok({
          aud: 'team-pulse-app',
          email: TEST_CONSTANTS.users.adminUser.email,
          exp: expect.any(Number),
          iat: expect.any(Number),
          iss: 'team-pulse-api',
          role: TEST_CONSTANTS.users.adminUser.role,
          userId: TEST_CONSTANTS.users.adminUser.id,
        }),
      )
    })

    it('should work end-to-end for refresh tokens', () => {
      // Create refresh token
      const createResult = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.superAdminUser.id,
      })

      const refreshToken = expectSuccess(createResult)

      // Verify refresh token JWT
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: refreshToken.token,
      })

      expect(verifyResult).toEqual(
        Ok({
          aud: 'team-pulse-app',
          exp: expect.any(Number),
          iat: expect.any(Number),
          iss: 'team-pulse-api',
          tokenId: refreshToken.id.getValue(),
          userId: TEST_CONSTANTS.users.superAdminUser.id,
        }),
      )
    })

    it('should not allow using refresh token as access token', () => {
      // Create refresh token
      const createResult = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const refreshToken = expectSuccess(createResult)

      // Try to verify refresh token as access token (should fail)
      const verifyResult = tokenFactory.verifyAccessToken({
        token: refreshToken.token,
      })

      const error = expectError(verifyResult)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.metadata?.field).toBe('accessToken')
    })

    it('should not allow using access token as refresh token', () => {
      // Create access token
      const createResult = tokenFactory.createAccessToken({
        email: TEST_CONSTANTS.users.johnDoe.email,
        role: TEST_CONSTANTS.users.johnDoe.role,
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const accessToken = expectSuccess(createResult)

      // Try to verify access token as refresh token (should fail)
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: accessToken,
      })

      const error = expectError(verifyResult)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.metadata?.field).toBe('refreshToken')
    })
  })
})
