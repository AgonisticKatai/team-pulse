import { TokenFactory } from '@application/factories/TokenFactory.js'
import { faker } from '@faker-js/faker'
import { TEST_TOKEN_ENV } from '@infrastructure/testing/test-env.js'
import { buildUser } from '@infrastructure/testing/user-builders.js'
import { AuthenticationError } from '@team-pulse/shared/errors'
import { Ok } from '@team-pulse/shared/result'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it } from 'vitest'

describe('TokenFactory', () => {
  let tokenFactory: TokenFactory

  const testUser = buildUser()

  beforeEach(() => {
    tokenFactory = TokenFactory.create({ env: TEST_TOKEN_ENV })
  })

  describe('createRefreshToken', () => {
    it('should create a valid refresh token with domain entity', () => {
      // Act
      const result = tokenFactory.createRefreshToken({ userId: testUser.id })

      // Assert
      const refreshToken = expectSuccess(result)

      // Verify domain entity properties
      expect(refreshToken.userId).toBe(testUser.id)
      expect(refreshToken.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/) // JWT format
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
      const result1 = tokenFactory.createRefreshToken({ userId: testUser.id })
      const result2 = tokenFactory.createRefreshToken({ userId: testUser.id })

      // Assert
      const token1 = expectSuccess(result1)
      const token2 = expectSuccess(result2)

      expect(token1.id).not.toBe(token2.id)
      expect(token1.token).not.toBe(token2.token)
    })

    it('should create verifiable refresh token JWT', () => {
      // Arrange
      const userId = testUser.id

      // Act
      const createResult = tokenFactory.createRefreshToken({ userId })
      const refreshToken = expectSuccess(createResult)

      // Verify the JWT
      const verifyResult = tokenFactory.verifyRefreshToken({ token: refreshToken.token })

      // Assert
      const payload = expectSuccess(verifyResult)
      expect(payload.userId).toBe(userId)
      expect(payload.tokenId).toBe(refreshToken.id)
    })
  })

  describe('createAccessToken', () => {
    it('should create a valid access token', () => {
      // Act
      const result = tokenFactory.createAccessToken({ email: testUser.email, role: testUser.role, userId: testUser.id })

      // Assert
      const token = expectSuccess(result)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should create verifiable access token with correct payload', () => {
      // Arrange
      const payload = { email: testUser.email, role: testUser.role, userId: testUser.id }

      // Act
      const createResult = tokenFactory.createAccessToken(payload)
      const token = expectSuccess(createResult)

      // Verify the JWT
      const verifyResult = tokenFactory.verifyAccessToken({ token })

      // Assert
      const verifiedPayload = expectSuccess(verifyResult)
      expect(verifiedPayload.email).toBe(payload.email.getValue())
      expect(verifiedPayload.role).toBe(payload.role.getValue())
      expect(verifiedPayload.userId).toBe(payload.userId)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      // Arrange
      const createResult = tokenFactory.createAccessToken({
        email: testUser.email,
        role: testUser.role,
        userId: testUser.id,
      })

      const token = expectSuccess(createResult)

      // Act
      const verifyResult = tokenFactory.verifyAccessToken({ token })

      // Assert
      expectSuccess(verifyResult)
    })

    it('should reject invalid access token', () => {
      // Act
      const result = tokenFactory.verifyAccessToken({ token: faker.string.uuid() })

      // Assert
      expectErrorType({ errorType: AuthenticationError, result })
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const createResult = tokenFactory.createRefreshToken({ userId: testUser.id })

      const refreshToken = expectSuccess(createResult)

      // Act
      const verifyResult = tokenFactory.verifyRefreshToken({ token: refreshToken.token })

      // Assert
      expectSuccess(verifyResult)
    })

    it('should reject invalid refresh token', () => {
      // Act
      const result = tokenFactory.verifyRefreshToken({ token: faker.string.uuid() })

      // Assert
      expectErrorType({ errorType: AuthenticationError, result })
    })
  })

  describe('integration', () => {
    it('should work end-to-end for access tokens', () => {
      // Create token
      const createResult = tokenFactory.createAccessToken({
        email: testUser.email,
        role: testUser.role,
        userId: testUser.id,
      })

      expect(createResult).toEqual(Ok(expect.any(String)))

      const token = expectSuccess(createResult)

      // Verify token
      const verifyResult = tokenFactory.verifyAccessToken({ token })

      expect(verifyResult).toEqual(
        Ok({
          aud: 'team-pulse-app',
          email: testUser.email.getValue(),
          exp: expect.any(Number),
          iat: expect.any(Number),
          iss: 'team-pulse-api',
          role: testUser.role.getValue(),
          userId: testUser.id,
        }),
      )
    })

    it('should work end-to-end for refresh tokens', () => {
      // Create refresh token
      const createResult = tokenFactory.createRefreshToken({ userId: testUser.id })

      const refreshToken = expectSuccess(createResult)

      // Verify refresh token JWT
      const verifyResult = tokenFactory.verifyRefreshToken({ token: refreshToken.token })

      expect(verifyResult).toEqual(
        Ok({
          aud: 'team-pulse-app',
          exp: expect.any(Number),
          iat: expect.any(Number),
          iss: 'team-pulse-api',
          tokenId: refreshToken.id,
          userId: testUser.id,
        }),
      )
    })

    it('should not allow using refresh token as access token', () => {
      // Create refresh token
      const createResult = tokenFactory.createRefreshToken({ userId: testUser.id })

      const refreshToken = expectSuccess(createResult)

      // Try to verify refresh token as access token (should fail)
      const verifyResult = tokenFactory.verifyAccessToken({ token: refreshToken.token })

      expectErrorType({ errorType: AuthenticationError, result: verifyResult })
    })

    it('should not allow using access token as refresh token', () => {
      // Create access token
      const createResult = tokenFactory.createAccessToken({
        email: testUser.email,
        role: testUser.role,
        userId: testUser.id,
      })

      const accessToken = expectSuccess(createResult)

      // Try to verify access token as refresh token (should fail)
      const verifyResult = tokenFactory.verifyRefreshToken({ token: accessToken })

      expectErrorType({ errorType: AuthenticationError, result: verifyResult })
    })
  })
})
