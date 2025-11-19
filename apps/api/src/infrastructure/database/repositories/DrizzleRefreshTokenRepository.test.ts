import { sql } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { RefreshToken } from '../../../domain/models/RefreshToken.js'
import { User } from '../../../domain/models/User.js'
import { hashPassword } from '../../auth/password-utils.js'
import { assertDefined, expectSuccess } from '../../testing/index.js'
import { setupTestEnvironment } from '../../testing/test-helpers.js'
import type { Database } from '../connection.js'
import { DrizzleRefreshTokenRepository } from './DrizzleRefreshTokenRepository.js'
import { DrizzleUserRepository } from './DrizzleUserRepository.js'

describe('DrizzleRefreshTokenRepository - Integration Tests', () => {
  let repository: DrizzleRefreshTokenRepository
  let userRepository: DrizzleUserRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = DrizzleRefreshTokenRepository.create({ db })
    userRepository = DrizzleUserRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean up refresh_tokens and users tables before each test
    await db.execute(sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  /**
   * Helper function to create a user for testing
   */
  async function createTestUser(userId: string, email: string): Promise<void> {
    const userResult = User.create({
      email,
      id: userId,
      passwordHash: await hashPassword('Test123!'),
      role: 'USER',
    })

    if (!userResult.ok) throw new Error('Failed to create test user')

    const saveResult = await userRepository.save({ user: userResult.value })
    if (!saveResult.ok) throw new Error('Failed to save test user')
  }

  describe('save', () => {
    it('should insert a new refresh token successfully', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      const tokenResult = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'test-refresh-token-123',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      // Act
      const result = await repository.save({ refreshToken: tokenResult.value })

      // Assert
      const savedToken = expectSuccess(result)
      expect(savedToken.id.getValue()).toBe('token-1')
      expect(savedToken.token).toBe('test-refresh-token-123')
      expect(savedToken.userId.getValue()).toBe('user-1')
      expect(savedToken.expiresAt).toBeInstanceOf(Date)
      expect(savedToken.createdAt).toBeInstanceOf(Date)
    })

    it('should update an existing refresh token (upsert)', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const initialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const tokenResult = RefreshToken.create({
        expiresAt: initialExpiresAt,
        id: 'token-1',
        token: 'initial-token',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      await repository.save({ refreshToken: tokenResult.value })

      // Create updated token with same ID
      const newExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now

      const updatedTokenResult = RefreshToken.create({
        expiresAt: newExpiresAt,
        id: 'token-1', // Same ID
        token: 'updated-token',
        userId: 'user-1',
      })

      if (!updatedTokenResult.ok) return

      // Act - Save again (upsert)
      const result = await repository.save({ refreshToken: updatedTokenResult.value })

      // Assert
      const savedToken = expectSuccess(result)
      expect(savedToken.token).toBe('updated-token')

      // Verify only one token exists
      const tokensForUser = expectSuccess(await repository.findByUserId({ userId: 'user-1' }))
      expect(tokensForUser).toHaveLength(1)
    })
  })

  describe('findByToken', () => {
    it('should find a refresh token by token string when it exists', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const tokenResult = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'unique-token-123',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      await repository.save({ refreshToken: tokenResult.value })

      // Act
      const result = await repository.findByToken({ token: 'unique-token-123' })

      // Assert
      const foundToken = expectSuccess(result)
      expect(foundToken).not.toBeNull()
      expect(foundToken?.id.getValue()).toBe('token-1')
      expect(foundToken?.token).toBe('unique-token-123')
      expect(foundToken?.userId.getValue()).toBe('user-1')
    })

    it('should return null when token does not exist', async () => {
      // Act
      const result = await repository.findByToken({ token: 'non-existent-token' })

      // Assert
      const foundToken = expectSuccess(result)
      expect(foundToken).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should return empty array when user has no tokens', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      // Act
      const result = await repository.findByUserId({ userId: 'user-1' })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toEqual([])
    })

    it('should find all refresh tokens for a user', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      // Create 3 tokens for the same user
      for (let i = 1; i <= 3; i++) {
        const expiresAt = new Date(Date.now() + i * 24 * 60 * 60 * 1000)

        const tokenResult = RefreshToken.create({
          expiresAt,
          id: `token-${i}`,
          token: `token-${i}`,
          userId: 'user-1',
        })

        if (!tokenResult.ok) return

        await repository.save({ refreshToken: tokenResult.value })
      }

      // Act
      const result = await repository.findByUserId({ userId: 'user-1' })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toHaveLength(3)
      expect(tokens.map((t) => t.token)).toContain('token-1')
      expect(tokens.map((t) => t.token)).toContain('token-2')
      expect(tokens.map((t) => t.token)).toContain('token-3')
    })

    it('should only return tokens for specified user', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')
      await createTestUser('user-2', 'user2@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Token for user-1
      const token1Result = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'user1-token',
        userId: 'user-1',
      })

      // Token for user-2
      const token2Result = RefreshToken.create({
        expiresAt,
        id: 'token-2',
        token: 'user2-token',
        userId: 'user-2',
      })

      if (!(token1Result.ok && token2Result.ok)) return

      await repository.save({ refreshToken: token1Result.value })
      await repository.save({ refreshToken: token2Result.value })

      // Act
      const result = await repository.findByUserId({ userId: 'user-1' })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toHaveLength(1)
      const [firstToken] = tokens
      assertDefined(firstToken)
      expect(firstToken.userId.getValue()).toBe('user-1')
    })
  })

  describe('deleteByToken', () => {
    it('should delete a refresh token by token string', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const tokenResult = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'token-to-delete',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      await repository.save({ refreshToken: tokenResult.value })

      // Act
      const result = await repository.deleteByToken({ token: 'token-to-delete' })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify token was deleted
      const findResult = await repository.findByToken({ token: 'token-to-delete' })
      const foundToken = expectSuccess(findResult)
      expect(foundToken).toBeNull()
    })

    it('should return false when deleting non-existent token', async () => {
      // Act
      const result = await repository.deleteByToken({ token: 'non-existent-token' })

      // Assert
      expect(expectSuccess(result)).toBe(false)
    })
  })

  describe('deleteByUserId', () => {
    it('should delete all refresh tokens for a user', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      // Create 3 tokens for the user
      for (let i = 1; i <= 3; i++) {
        const expiresAt = new Date(Date.now() + i * 24 * 60 * 60 * 1000)

        const tokenResult = RefreshToken.create({
          expiresAt,
          id: `token-${i}`,
          token: `token-${i}`,
          userId: 'user-1',
        })

        if (!tokenResult.ok) return

        await repository.save({ refreshToken: tokenResult.value })
      }

      // Act
      const result = await repository.deleteByUserId({ userId: 'user-1' })

      // Assert
      expect(expectSuccess(result)).toBe(3)

      // Verify all tokens were deleted
      const remainingTokens = expectSuccess(await repository.findByUserId({ userId: 'user-1' }))
      expect(remainingTokens).toHaveLength(0)
    })

    it('should return 0 when user has no tokens', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      // Act
      const result = await repository.deleteByUserId({ userId: 'user-1' })

      // Assert
      expect(expectSuccess(result)).toBe(0)
    })

    it('should only delete tokens for specified user', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')
      await createTestUser('user-2', 'user2@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      // Token for user-1
      const token1Result = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'user1-token',
        userId: 'user-1',
      })

      // Token for user-2
      const token2Result = RefreshToken.create({
        expiresAt,
        id: 'token-2',
        token: 'user2-token',
        userId: 'user-2',
      })

      if (!(token1Result.ok && token2Result.ok)) return

      await repository.save({ refreshToken: token1Result.value })
      await repository.save({ refreshToken: token2Result.value })

      // Act - Delete only user-1 tokens
      const result = await repository.deleteByUserId({ userId: 'user-1' })

      // Assert
      expect(expectSuccess(result)).toBe(1)

      // Verify user-2 token still exists
      const user2Tokens = expectSuccess(await repository.findByUserId({ userId: 'user-2' }))
      expect(user2Tokens).toHaveLength(1)
    })
  })

  describe('deleteExpired', () => {
    it('should delete expired tokens', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago (expired)
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now (valid)

      // Create expired token
      const expiredTokenResult = RefreshToken.create({
        expiresAt: pastDate,
        id: 'expired-token',
        token: 'expired-token',
        userId: 'user-1',
      })

      // Create valid token
      const validTokenResult = RefreshToken.create({
        expiresAt: futureDate,
        id: 'valid-token',
        token: 'valid-token',
        userId: 'user-1',
      })

      if (!(expiredTokenResult.ok && validTokenResult.ok)) return

      await repository.save({ refreshToken: expiredTokenResult.value })
      await repository.save({ refreshToken: validTokenResult.value })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(expectSuccess(result)).toBe(1)

      // Verify expired token was deleted
      const expiredToken = expectSuccess(await repository.findByToken({ token: 'expired-token' }))
      expect(expiredToken).toBeNull()

      // Verify valid token still exists
      const validToken = expectSuccess(await repository.findByToken({ token: 'valid-token' }))
      expect(validToken).not.toBeNull()
    })

    it('should delete multiple expired tokens', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')
      await createTestUser('user-2', 'user2@test.com')

      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago (expired)

      // Create 3 expired tokens
      for (let i = 1; i <= 3; i++) {
        const tokenResult = RefreshToken.create({
          expiresAt: pastDate,
          id: `expired-token-${i}`,
          token: `expired-token-${i}`,
          userId: i <= 2 ? 'user-1' : 'user-2',
        })

        if (!tokenResult.ok) return

        await repository.save({ refreshToken: tokenResult.value })
      }

      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(expectSuccess(result)).toBe(3)

      // Verify all expired tokens were deleted
      const user1Tokens = expectSuccess(await repository.findByUserId({ userId: 'user-1' }))
      const user2Tokens = expectSuccess(await repository.findByUserId({ userId: 'user-2' }))
      expect(user1Tokens).toHaveLength(0)
      expect(user2Tokens).toHaveLength(0)
    })

    it('should return 0 when no tokens are expired', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now (valid)

      const tokenResult = RefreshToken.create({
        expiresAt: futureDate,
        id: 'valid-token',
        token: 'valid-token',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      await repository.save({ refreshToken: tokenResult.value })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(expectSuccess(result)).toBe(0)

      // Verify token still exists
      const validToken = expectSuccess(await repository.findByToken({ token: 'valid-token' }))
      expect(validToken).not.toBeNull()
    })

    it('should return 0 when no tokens exist', async () => {
      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(expectSuccess(result)).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle tokens with near-expiry dates', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      // Token that expires in 1 second
      const nearExpiryDate = new Date(Date.now() + 1000)

      const tokenResult = RefreshToken.create({
        expiresAt: nearExpiryDate,
        id: 'near-expiry-token',
        token: 'near-expiry-token',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      // Act
      await repository.save({ refreshToken: tokenResult.value })

      // Assert - Token should still be findable before expiry
      const foundToken = expectSuccess(await repository.findByToken({ token: 'near-expiry-token' }))
      expect(foundToken).not.toBeNull()
    })

    it('should handle timestamps correctly', async () => {
      // Arrange
      await createTestUser('user-1', 'user1@test.com')

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const tokenResult = RefreshToken.create({
        expiresAt,
        id: 'token-1',
        token: 'test-token',
        userId: 'user-1',
      })

      if (!tokenResult.ok) return

      // Act
      await repository.save({ refreshToken: tokenResult.value })

      // Assert
      const foundToken = expectSuccess(await repository.findByToken({ token: 'test-token' }))
      expect(foundToken).not.toBeNull()
      expect(foundToken?.createdAt).toBeInstanceOf(Date)
      expect(foundToken?.expiresAt).toBeInstanceOf(Date)
      expect(foundToken?.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(foundToken?.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })
  })
})
