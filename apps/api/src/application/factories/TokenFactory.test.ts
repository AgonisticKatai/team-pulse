import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { Ok } from '../../domain/types/Result.js'
import { TEST_CONSTANTS, TEST_ENV } from '../../infrastructure/testing/index.js'
import { TokenFactory } from './TokenFactory.js'

describe('TokenFactory', () => {
  let tokenFactory: TokenFactory

  beforeEach(() => {
    tokenFactory = TokenFactory.create({ env: TEST_ENV })
  })

  describe('createRefreshToken', () => {
    it('should create a valid refresh token with domain entity', () => {
      // Act
      const result = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(result.ok).toBe(true)

      if (!result.ok) return

      const refreshToken = result.value

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
      expect(result1.ok).toBe(true)
      expect(result2.ok).toBe(true)

      if (!(result1.ok && result2.ok)) return

      expect(result1.value.id.getValue()).not.toBe(result2.value.id.getValue())
      expect(result1.value.token).not.toBe(result2.value.token)
    })

    it('should create verifiable refresh token JWT', () => {
      // Arrange
      const userId = TEST_CONSTANTS.users.johnDoe.id

      // Act
      const createResult = tokenFactory.createRefreshToken({ userId })
      expect(createResult.ok).toBe(true)

      if (!createResult.ok) return

      const refreshToken = createResult.value

      // Verify the JWT
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: refreshToken.token,
      })

      // Assert
      expect(verifyResult.ok).toBe(true)

      if (!verifyResult.ok) return

      expect(verifyResult.value.userId).toBe(userId)
      expect(verifyResult.value.tokenId).toBe(refreshToken.id.getValue())
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
      expect(result.ok).toBe(true)

      if (!result.ok) return

      const token = result.value
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
      expect(createResult.ok).toBe(true)

      if (!createResult.ok) return

      // Verify the JWT
      const verifyResult = tokenFactory.verifyAccessToken({
        token: createResult.value,
      })

      // Assert
      expect(verifyResult.ok).toBe(true)

      if (!verifyResult.ok) return

      expect(verifyResult.value.email).toBe(payload.email)
      expect(verifyResult.value.role).toBe(payload.role)
      expect(verifyResult.value.userId).toBe(payload.userId)
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

      expect(createResult.ok).toBe(true)
      if (!createResult.ok) return

      // Act
      const verifyResult = tokenFactory.verifyAccessToken({
        token: createResult.value,
      })

      // Assert
      expect(verifyResult.ok).toBe(true)
    })

    it('should reject invalid access token', () => {
      // Act
      const result = tokenFactory.verifyAccessToken({
        token: 'invalid-token',
      })

      // Assert
      expect(result.ok).toBe(false)

      if (result.ok) return

      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.error.field).toBe('accessToken')
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      // Arrange
      const createResult = tokenFactory.createRefreshToken({
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      expect(createResult.ok).toBe(true)
      if (!createResult.ok) return

      // Act
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: createResult.value.token,
      })

      // Assert
      expect(verifyResult.ok).toBe(true)
    })

    it('should reject invalid refresh token', () => {
      // Act
      const result = tokenFactory.verifyRefreshToken({
        token: 'invalid-token',
      })

      // Assert
      expect(result.ok).toBe(false)

      if (result.ok) return

      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.error.field).toBe('refreshToken')
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

      if (!createResult.ok) return

      // Verify token
      const verifyResult = tokenFactory.verifyAccessToken({
        token: createResult.value,
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

      expect(createResult.ok).toBe(true)
      if (!createResult.ok) return

      const refreshToken = createResult.value

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

      expect(createResult.ok).toBe(true)
      if (!createResult.ok) return

      // Try to verify refresh token as access token (should fail)
      const verifyResult = tokenFactory.verifyAccessToken({
        token: createResult.value.token,
      })

      expect(verifyResult.ok).toBe(false)

      if (verifyResult.ok) return

      expect(verifyResult.error).toBeInstanceOf(ValidationError)
      expect(verifyResult.error.field).toBe('accessToken')
    })

    it('should not allow using access token as refresh token', () => {
      // Create access token
      const createResult = tokenFactory.createAccessToken({
        email: TEST_CONSTANTS.users.johnDoe.email,
        role: TEST_CONSTANTS.users.johnDoe.role,
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      expect(createResult.ok).toBe(true)
      if (!createResult.ok) return

      // Try to verify access token as refresh token (should fail)
      const verifyResult = tokenFactory.verifyRefreshToken({
        token: createResult.value,
      })

      expect(verifyResult.ok).toBe(false)

      if (verifyResult.ok) return

      expect(verifyResult.error).toBeInstanceOf(ValidationError)
      expect(verifyResult.error.field).toBe('refreshToken')
    })
  })
})
