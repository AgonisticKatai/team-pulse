import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { EntityId } from '../value-objects/index.js'
import { RefreshToken } from './RefreshToken.js'

// Helper to create user from persistence and unwrap Result
function createRefreshToken(data: Parameters<typeof RefreshToken.create>[0]): RefreshToken {
  return expectSuccess(RefreshToken.create(data))
}

function createRefreshTokenError(data: Parameters<typeof RefreshToken.create>[0]): ValidationError {
  return expectError(RefreshToken.create(data))
}

describe('RefreshToken Domain Entity', () => {
  describe('create', () => {
    it('should create a valid refresh token', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token-string',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.id).toBeInstanceOf(EntityId)
      expect(token.id.getValue()).toBe('token-123')
      expect(token.token).toBe('refresh-token-string')
      expect(token.userId).toBeInstanceOf(EntityId)
      expect(token.userId.getValue()).toBe('user-123')
      expect(token.expiresAt).toBe(expiresAt)
      expect(token.createdAt).toBeInstanceOf(Date)
    })

    it('should return error for empty token', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const error = createRefreshTokenError({
        expiresAt,
        id: 'token-123',
        token: '',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('token')
    })

    it('should return error for empty userId', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const error = createRefreshTokenError({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: '',
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('id')
    })

    it('should return error for empty id', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const error = createRefreshTokenError({
        expiresAt,
        id: '',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('id')
    })

    it('should allow creation with past expiration date', () => {
      // Arrange
      const expiresAt = new Date(Date.now() - 1000) // Expired

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.isExpired()).toBe(true)
    })
  })

  describe('create with timestamps', () => {
    it('should create refresh token with provided timestamp', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00Z')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = createRefreshToken({
        createdAt,
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.createdAt).toBe(createdAt)
    })

    it('should create refresh token with auto-generated timestamp', () => {
      // Arrange
      const before = new Date()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const after = new Date()

      // Assert
      expect(token.createdAt).toBeInstanceOf(Date)
      expect(token.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(token.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('fromValueObjects', () => {
    it('should create refresh token from validated value objects', () => {
      // Arrange
      const id = expectSuccess(EntityId.create({ value: 'token-123' }))
      const userId = expectSuccess(EntityId.create({ value: 'user-123' }))
      const createdAt = new Date()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = RefreshToken.fromValueObjects({
        createdAt,
        expiresAt,
        id,
        token: 'refresh-token',
        userId,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.id).toBe(id)
      expect(token.userId).toBe(userId)
    })
  })

  describe('isExpired', () => {
    it('should return false for future expiration', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days future

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token.isExpired()).toBe(false)
    })

    it('should return true for past expiration', () => {
      // Arrange
      const expiresAt = new Date(Date.now() - 1000) // 1 second ago

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token.isExpired()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true for non-expired token', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(token.isValid()).toBe(true)
    })

    it('should return false for expired token', () => {
      // Arrange
      const expiresAt = new Date(Date.now() - 1000)

      // Act
      const token = expectSuccess(
        RefreshToken.create({
          expiresAt,
          id: 'token-123',
          token: 'refresh-token',
          userId: TEST_CONSTANTS.users.johnDoe.id,
        }),
      )

      // Assert
      expect(token.isValid()).toBe(false)
    })

    it('should be opposite of isExpired', () => {
      // Arrange & Act
      const expiredToken = createRefreshToken({
        expiresAt: new Date(Date.now() - 1000),
        id: 'token-1',
        token: 'expired-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const validToken = createRefreshToken({
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        id: 'token-2',
        token: 'valid-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      // Assert
      expect(expiredToken.isValid()).toBe(!expiredToken.isExpired())
      expect(validToken.isValid()).toBe(!validToken.isExpired())
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'refresh-token-string',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const obj = token.toObject()

      // Assert
      expect(obj.id).toBe('token-123')
      expect(obj.token).toBe('refresh-token-string')
      expect(obj.userId).toBe('user-123')
      expect(obj.expiresAt).toBe(expiresAt)
      expect(obj.createdAt).toBeInstanceOf(Date)
    })

    it('should include token string in toObject', () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: 'token-123',
        token: 'secret-refresh-token',
        userId: TEST_CONSTANTS.users.johnDoe.id,
      })

      const obj = token.toObject()

      // Assert
      // Unlike password, we DO include the token (it's needed for comparison)
      expect(obj.token).toBe('secret-refresh-token')
    })
  })
})
