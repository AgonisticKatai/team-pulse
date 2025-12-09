import { RefreshToken } from '@domain/models/RefreshToken.js'
import { faker } from '@faker-js/faker'
import { IdUtils, type RefreshTokenId, type UserId, ValidationError } from '@team-pulse/shared'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'

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
      const expiresAt = faker.date.future({ refDate: new Date() })

      const validId = IdUtils.generate<RefreshTokenId>()
      const validUserId = IdUtils.generate<UserId>()

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: validId,
        token: testToken,
        userId: validUserId,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)

      expect(token.id).toBe(validId)
      expect(typeof token.id).toBe('string')

      expect(token.token).toBe(testToken)
      expect(token.userId).toBe(validUserId)

      expect(token.expiresAt).toBe(expiresAt)
      expect(token.createdAt).toBeInstanceOf(Date)
    })

    it('should return error for empty token string', () => {
      // Arrange
      const expiresAt = faker.date.future({ refDate: new Date() })

      const validId = IdUtils.generate<RefreshTokenId>()
      const validUserId = IdUtils.generate<UserId>()

      const testToken = ''

      // Act
      const error = createRefreshTokenError({
        expiresAt,
        id: validId,
        token: testToken,
        userId: validUserId,
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
    })

    // ⚠️ ARCHITECTURE NOTE:
    // With Branded Types, passing an empty string '' as UserId is a TypeScript error.
    // However, if you force it with 'as UserId' or 'as any', the entity should protect itself.
    it('should return error (or throw) for invalid userId', () => {
      // Arrange
      const expiresAt = faker.date.future({ refDate: new Date() })

      const validId = IdUtils.generate<RefreshTokenId>()

      const testToken = faker.string.uuid()

      // Act & Assert
      // In the new architecture, IdUtils.toId('') would throw an error before reaching the entity.
      // If you force it with 'as UserId' or 'as any', the entity should protect itself.

      // Option A: If your create expects UserId typed, typescript will warn you here.
      // Option B: If you're testing "runtime safety", force the type:
      const invalidUserId = '' as UserId

      const error = createRefreshTokenError({
        expiresAt,
        id: validId,
        token: testToken,
        userId: invalidUserId,
      })

      expect(error).toBeInstanceOf(ValidationError)
    })

    it('should allow creation with past expiration date (logic check)', () => {
      // Arrange
      const expiresAt = faker.date.past({ refDate: new Date() }) // Expired

      const validId = IdUtils.generate<RefreshTokenId>()
      const validUserId = IdUtils.generate<UserId>()

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: validId,
        token: testToken,
        userId: validUserId,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.isExpired()).toBe(true)
      expect(token.isValid()).toBe(false)
    })
  })

  describe('create with timestamps', () => {
    it('should create refresh token with provided timestamp', () => {
      // Arrange
      const createdAt = faker.date.past({ refDate: new Date() })
      const expiresAt = faker.date.future({ refDate: new Date() })

      const validId = IdUtils.generate<RefreshTokenId>()
      const validUserId = IdUtils.generate<UserId>()

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        createdAt,
        expiresAt,
        id: validId,
        token: testToken,
        userId: validUserId,
      })

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.createdAt).toBe(createdAt)
      expect(token.expiresAt).toBe(expiresAt)
      expect(token.id).toBe(validId)
      expect(token.token).toBe(testToken)
      expect(token.userId).toBe(validUserId)
    })

    it('should create refresh token with auto-generated timestamp', () => {
      // Arrange
      const before = faker.date.past({ refDate: new Date() })
      const expiresAt = faker.date.future({ refDate: new Date() })

      const validId = IdUtils.generate<RefreshTokenId>()
      const validUserId = IdUtils.generate<UserId>()

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: validId,
        token: testToken,
        userId: validUserId,
      })

      const after = new Date()

      // Assert
      expect(token.createdAt).toBeInstanceOf(Date)
      expect(token.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(token.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(token.expiresAt).toBe(expiresAt)
      expect(token.id).toBe(validId)
      expect(token.token).toBe(testToken)
      expect(token.userId).toBe(validUserId)
    })
  })

  describe('isExpired', () => {
    it('should return false for future expiration', () => {
      // Arrange
      const expiresAt = faker.date.future({ refDate: new Date() })

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: IdUtils.generate<RefreshTokenId>(),
        token: testToken,
        userId: IdUtils.generate<UserId>(),
      })

      // Assert
      expect(token.isExpired()).toBe(false)
    })

    it('should return true for past expiration', () => {
      // Arrange
      const expiresAt = faker.date.past({ refDate: new Date() })

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: IdUtils.generate<RefreshTokenId>(),
        token: faker.string.uuid(),
        userId: IdUtils.generate<UserId>(),
      })

      // Assert
      expect(token.isExpired()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true for non-expired token', () => {
      // Arrange
      const expiresAt = faker.date.future({ refDate: new Date() })

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: IdUtils.generate<RefreshTokenId>(),
        token: faker.string.uuid(),
        userId: IdUtils.generate<UserId>(),
      })

      // Assert
      expect(token.isValid()).toBe(true)
    })

    it('should return false for expired token', () => {
      // Arrange
      const expiresAt = faker.date.past({ refDate: new Date() })

      // Act
      const token = createRefreshToken({
        expiresAt,
        id: IdUtils.generate<RefreshTokenId>(),
        token: faker.string.uuid(),
        userId: IdUtils.generate<UserId>(),
      })

      // Assert
      expect(token.isValid()).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      // Arrange
      const expiresAt = faker.date.future({ refDate: new Date() })

      const id = IdUtils.generate<RefreshTokenId>()
      const userId = IdUtils.generate<UserId>()

      const testToken = faker.string.uuid()

      // Act
      const token = createRefreshToken({
        expiresAt,
        id,
        token: testToken,
        userId,
      })

      const obj = token.toObject()

      // Assert
      expect(obj.id).toBe(id)
      expect(obj.token).toBe(testToken)
      expect(obj.userId).toBe(userId)
      expect(obj.expiresAt).toBe(expiresAt)
      expect(obj.createdAt).toBeInstanceOf(Date)
    })
  })
})
