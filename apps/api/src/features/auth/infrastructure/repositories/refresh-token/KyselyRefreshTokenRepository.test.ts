import { RefreshToken } from '@features/auth/domain/models/index.js'
import { KyselyRefreshTokenRepository } from '@features/auth/infrastructure/repositories/refresh-token/KyselyRefreshTokenRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import { setupTestEnvironment } from '@shared/testing/helpers/test-helpers.js'
import { RefreshTokenId, RepositoryError, USER_ROLES, UserId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { sql } from 'kysely'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('KyselyRefreshTokenRepository', () => {
  let repository: KyselyRefreshTokenRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  // Test data
  const userId = UserId.random()
  const userId2 = UserId.random()
  const tokenId = RefreshTokenId.random()
  const tokenId2 = RefreshTokenId.random()

  beforeAll(() => {
    db = getDatabase()
    repository = KyselyRefreshTokenRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean database for test isolation
    await sql`TRUNCATE TABLE users, refresh_tokens RESTART IDENTITY CASCADE`.execute(db)

    // Create test users (required for foreign key constraints)
    await db
      .insertInto('users')
      .values([
        {
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          created_at: new Date(),
          email: 'user1@test.com',
          id: userId,
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          password_hash: 'hashed-password',
          role: USER_ROLES.GUEST,
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          updated_at: new Date(),
        },
        {
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          created_at: new Date(),
          email: 'user2@test.com',
          id: userId2,
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          password_hash: 'hashed-password',
          role: USER_ROLES.GUEST,
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          updated_at: new Date(),
        },
      ])
      .execute()
  })

  describe('Factory Pattern', () => {
    it('should create repository instance with factory method', () => {
      // Act
      const repo = KyselyRefreshTokenRepository.create({ db })

      // Assert
      expect(repo).toBeInstanceOf(KyselyRefreshTokenRepository)
    })
  })

  describe('save', () => {
    it('should save a new refresh token', async () => {
      // Arrange
      const refreshToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          id: tokenId,
          token: 'test-token-123',
          userId,
        }),
      )

      // Act
      const result = await repository.save({ refreshToken })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.id).toBe(refreshToken.id)
      expect(saved.token).toBe(refreshToken.token)
      expect(saved.userId).toBe(refreshToken.userId)
    })

    it('should update existing refresh token on conflict (upsert)', async () => {
      // Arrange - Save initial token
      const initialToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'initial-token',
          userId,
        }),
      )
      await repository.save({ refreshToken: initialToken })

      // Create new token with same ID but different token value
      const updatedToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          id: tokenId, // Same ID
          token: 'updated-token',
          userId,
        }),
      )

      // Act
      const result = await repository.save({ refreshToken: updatedToken })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.token).toBe('updated-token')

      // Verify only one token exists
      const allTokens = await db.selectFrom('refresh_tokens').selectAll().execute()
      expect(allTokens).toHaveLength(1)
      expect(allTokens[0]?.token).toBe('updated-token')
    })

    it('should return RepositoryError on database failure', async () => {
      // Arrange - Create token with invalid userId (violates foreign key constraint)
      const refreshToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'test-token',
          userId: '00000000-0000-0000-0000-000000000000' as UserId, // Non-existent user
        }),
      )

      // Act
      const result = await repository.save({ refreshToken })

      // Assert
      const error = expectErrorType({ errorType: RepositoryError, result })
      expect(error.message).toContain('Failed to save refresh token')
      expect(error.metadata?.operation).toBe('save')
    })
  })

  describe('findByToken', () => {
    it('should find refresh token by token string', async () => {
      // Arrange
      const refreshToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'find-me-token',
          userId,
        }),
      )
      await repository.save({ refreshToken })

      // Act
      const result = await repository.findByToken({ token: 'find-me-token' })

      // Assert
      const found = expectSuccess(result)
      expect(found).not.toBeNull()
      expect(found?.token).toBe('find-me-token')
      expect(found?.userId).toBe(userId)
    })

    it('should return null when token not found', async () => {
      // Act
      const result = await repository.findByToken({ token: 'non-existent-token' })

      // Assert
      const found = expectSuccess(result)
      expect(found).toBeNull()
    })

    it('should return RepositoryError when mapping fails', async () => {
      // Arrange - Insert invalid data directly to DB (bypassing domain validation)
      await db
        .insertInto('refresh_tokens')
        .values({
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          created_at: new Date(),
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          expires_at: new Date(),
          id: 'invalid-uuid', // Invalid UUID format
          token: 'test-token',
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          user_id: userId,
        })
        .execute()

      // Act
      const result = await repository.findByToken({ token: 'test-token' })

      // Assert
      const error = expectErrorType({ errorType: RepositoryError, result })
      expect(error.message).toContain('Failed to map refresh token to domain')
      expect(error.metadata?.operation).toBe('findByToken')
    })
  })

  describe('findByUserId', () => {
    it('should find all refresh tokens for a user', async () => {
      // Arrange - Create multiple tokens for same user
      const token1 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'user-token-1',
          userId,
        }),
      )
      const token2 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId2,
          token: 'user-token-2',
          userId,
        }),
      )
      await repository.save({ refreshToken: token1 })
      await repository.save({ refreshToken: token2 })

      // Act
      const result = await repository.findByUserId({ userId })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toHaveLength(2)
      expect(tokens.map((t) => t.token)).toContain('user-token-1')
      expect(tokens.map((t) => t.token)).toContain('user-token-2')
    })

    it('should return empty array when user has no tokens', async () => {
      // Act
      const result = await repository.findByUserId({ userId: UserId.random() })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toEqual([])
    })

    it('should only return tokens for specified user', async () => {
      // Arrange - Create tokens for different users
      const token1 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'user1-token',
          userId,
        }),
      )
      const token2 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId2,
          token: 'user2-token',
          userId: userId2,
        }),
      )
      await repository.save({ refreshToken: token1 })
      await repository.save({ refreshToken: token2 })

      // Act
      const result = await repository.findByUserId({ userId })

      // Assert
      const tokens = expectSuccess(result)
      expect(tokens).toHaveLength(1)
      expect(tokens[0]?.token).toBe('user1-token')
    })

    it('should return RepositoryError when mapping fails', async () => {
      // Arrange - Insert invalid data directly to DB
      await db
        .insertInto('refresh_tokens')
        .values({
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          created_at: new Date(),
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          expires_at: new Date(),
          id: 'invalid-uuid',
          token: 'test-token',
          // biome-ignore lint/style/useNamingConvention: Database column names use snake_case
          user_id: userId,
        })
        .execute()

      // Act
      const result = await repository.findByUserId({ userId })

      // Assert
      const error = expectErrorType({ errorType: RepositoryError, result })
      expect(error.message).toContain('Failed to map refresh token to domain')
      expect(error.metadata?.operation).toBe('findByUserId')
    })
  })

  describe('deleteByToken', () => {
    it('should delete refresh token by token string', async () => {
      // Arrange
      const refreshToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'delete-me-token',
          userId,
        }),
      )
      await repository.save({ refreshToken })

      // Act
      const result = await repository.deleteByToken({ token: 'delete-me-token' })

      // Assert
      const deleted = expectSuccess(result)
      expect(deleted).toBe(true)

      // Verify token is gone
      const findResult = await repository.findByToken({ token: 'delete-me-token' })
      const found = expectSuccess(findResult)
      expect(found).toBeNull()
    })

    it('should return false when token does not exist', async () => {
      // Act
      const result = await repository.deleteByToken({ token: 'non-existent-token' })

      // Assert
      const deleted = expectSuccess(result)
      expect(deleted).toBe(false)
    })
  })

  describe('deleteByUserId', () => {
    it('should delete all refresh tokens for a user', async () => {
      // Arrange - Create multiple tokens for same user
      const token1 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'user-token-1',
          userId,
        }),
      )
      const token2 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId2,
          token: 'user-token-2',
          userId,
        }),
      )
      await repository.save({ refreshToken: token1 })
      await repository.save({ refreshToken: token2 })

      // Act
      const result = await repository.deleteByUserId({ userId })

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(2)

      // Verify tokens are gone
      const findResult = await repository.findByUserId({ userId })
      const tokens = expectSuccess(findResult)
      expect(tokens).toEqual([])
    })

    it('should return 0 when user has no tokens', async () => {
      // Act
      const result = await repository.deleteByUserId({ userId: UserId.random() })

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(0)
    })

    it('should only delete tokens for specified user', async () => {
      // Arrange - Create tokens for different users
      const token1 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'user1-token',
          userId,
        }),
      )
      const token2 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId2,
          token: 'user2-token',
          userId: userId2,
        }),
      )
      await repository.save({ refreshToken: token1 })
      await repository.save({ refreshToken: token2 })

      // Act
      const result = await repository.deleteByUserId({ userId })

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(1)

      // Verify only user1 tokens are deleted
      const user2Result = await repository.findByUserId({ userId: userId2 })
      const user2Tokens = expectSuccess(user2Result)
      expect(user2Tokens).toHaveLength(1)
      expect(user2Tokens[0]?.token).toBe('user2-token')
    })
  })

  describe('deleteExpired', () => {
    it('should delete all expired refresh tokens', async () => {
      // Arrange - Create expired and non-expired tokens
      const expiredToken1 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          id: tokenId,
          token: 'expired-token-1',
          userId,
        }),
      )
      const expiredToken2 = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          id: tokenId2,
          token: 'expired-token-2',
          userId: userId2,
        }),
      )
      const validToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          id: RefreshTokenId.random(),
          token: 'valid-token',
          userId,
        }),
      )
      await repository.save({ refreshToken: expiredToken1 })
      await repository.save({ refreshToken: expiredToken2 })
      await repository.save({ refreshToken: validToken })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(2)

      // Verify only valid token remains
      const allTokens = await db.selectFrom('refresh_tokens').selectAll().execute()
      expect(allTokens).toHaveLength(1)
      expect(allTokens[0]?.token).toBe('valid-token')
    })

    it('should return 0 when no expired tokens exist', async () => {
      // Arrange - Create only valid tokens
      const validToken = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          id: tokenId,
          token: 'valid-token',
          userId,
        }),
      )
      await repository.save({ refreshToken: validToken })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(0)
    })

    it('should handle edge case where token expires exactly now', async () => {
      // Arrange - Create token that expires right now
      const now = new Date()
      const tokenExpiringNow = expectSuccess(
        RefreshToken.create({
          expiresAt: new Date(now.getTime() - 100), // 100ms ago
          id: tokenId,
          token: 'expiring-now-token',
          userId,
        }),
      )
      await repository.save({ refreshToken: tokenExpiringNow })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(1)
    })
  })
})
