import { RefreshToken } from '@domain/models/RefreshToken.js'
import type { User } from '@domain/models/User.js'
import { faker } from '@faker-js/faker'
import { ScryptPasswordHasher } from '@infrastructure/auth/ScryptPasswordHasher.js'
import type { Database } from '@infrastructure/database/connection.js'
import { DrizzleRefreshTokenRepository } from '@infrastructure/database/repositories/DrizzleRefreshTokenRepository.js'
import { DrizzleUserRepository } from '@infrastructure/database/repositories/DrizzleUserRepository.js'
import { buildRefreshToken, buildUser } from '@infrastructure/testing/index.js'
import { setupTestEnvironment } from '@infrastructure/testing/test-helpers.js'
import { expectSingle, expectSuccess } from '@team-pulse/shared/testing'
import { sql } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('DrizzleRefreshTokenRepository - Integration Tests', () => {
  let repository: DrizzleRefreshTokenRepository
  let userRepository: DrizzleUserRepository
  let db: Database
  let passwordHasher: ScryptPasswordHasher

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = DrizzleRefreshTokenRepository.create({ db })
    userRepository = DrizzleUserRepository.create({ db })
    passwordHasher = ScryptPasswordHasher.create({ cost: 1024 }) // Low cost for fast tests
  })

  beforeEach(async () => {
    // Clean up tables (Order matters due to Foreign Keys)
    await db.execute(sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  /**
   * Helper function to create and save a user for testing.
   * Returns the full User entity so we can use its ID.
   */
  async function createPersistedUser(): Promise<User> {
    const passwordHash = expectSuccess(await passwordHasher.hash({ password: faker.internet.password() }))

    // Use the Builder to generate valid user data
    const user = buildUser({ passwordHash })

    expectSuccess(await userRepository.save({ user }))

    return user
  }

  describe('save', () => {
    it('should insert a new refresh token successfully', async () => {
      // Arrange
      const user = await createPersistedUser() // Creates a real user in DB

      // Use builder to create a token linked to that user
      const token = buildRefreshToken({
        userId: user.id,
      })

      // Act
      const result = await repository.save({ refreshToken: token })

      // Assert
      const savedToken = expectSuccess(result)

      // ✅ Direct comparison (Branded Types are strings at runtime)
      expect(savedToken.id).toBe(token.id)
      expect(savedToken.token).toBe(token.token)
      expect(savedToken.userId).toBe(user.id)
      expect(savedToken.expiresAt).toBeInstanceOf(Date)
      expect(savedToken.createdAt).toBeInstanceOf(Date)
    })

    it('should update an existing refresh token (upsert)', async () => {
      // Arrange
      const user = await createPersistedUser()

      const token = buildRefreshToken({ userId: user.id })

      // Initial save
      await repository.save({ refreshToken: token })

      // Create an updated version of the SAME token (same ID)
      // We manually construct it or modify the existing one to ensure ID match
      const updatedToken = RefreshToken.create({
        createdAt: token.createdAt,
        expiresAt: faker.date.future(),
        id: token.id, // SAME ID
        token: 'updated-token-string',
        userId: user.id,
      })

      if (!updatedToken.ok) throw new Error('Failed to create updated token')

      // Act - Save again (upsert)
      const result = await repository.save({ refreshToken: updatedToken.value })

      // Assert
      const savedToken = expectSuccess(result)
      expect(savedToken.token).toBe('updated-token-string')

      // Verify only one token exists in DB for this user
      const tokensForUser = expectSuccess(await repository.findByUserId({ userId: user.id }))
      expect(tokensForUser).toHaveLength(1)
    })
  })

  describe('findByToken', () => {
    it('should find a refresh token by token string when it exists', async () => {
      // Arrange
      const user = await createPersistedUser()
      const token = buildRefreshToken({ userId: user.id })

      await repository.save({ refreshToken: token })

      // Act
      const result = await repository.findByToken({ token: token.token })

      // Assert
      const foundToken = expectSuccess(result)
      expect(foundToken).not.toBeNull()
      expect(foundToken?.id).toBe(token.id)
      expect(foundToken?.userId).toBe(user.id)
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
    it('should find all refresh tokens for a user', async () => {
      // Arrange
      const user = await createPersistedUser()
      const quantity = 3

      // 1. Generate entities in memory (Functional)
      const tokensToCreate = Array.from({ length: quantity }, () => buildRefreshToken({ userId: user.id }))

      // 2. Save in parallel (Performance 🚀)
      // Instead of waiting one by one, launch all promises together.
      await Promise.all(tokensToCreate.map((token) => repository.save({ refreshToken: token })))

      // Act
      const result = await repository.findByUserId({ userId: user.id })

      // Assert
      const foundTokens = expectSuccess(result)

      expect(foundTokens).toHaveLength(quantity)

      // Bonus: Verify that the IDs retrieved are the ones we created (Integrity)
      const createdIds = tokensToCreate.map((token) => token.id)
      const foundIds = foundTokens.map((token) => token.id)

      // Verify that foundIds contains all createdIds (regardless of order)
      expect(foundIds).toEqual(expect.arrayContaining(createdIds))
    })

    it('should only return tokens for specified user', async () => {
      // Arrange
      const user1 = await createPersistedUser()
      const user2 = await createPersistedUser()

      const token1 = buildRefreshToken({ userId: user1.id })
      const token2 = buildRefreshToken({ userId: user2.id })

      await repository.save({ refreshToken: token1 })
      await repository.save({ refreshToken: token2 })

      // Act
      const result = await repository.findByUserId({ userId: user1.id })

      // Assert
      const foundTokens = expectSingle(result)

      expect(foundTokens.userId).toBe(user1.id)
    })
  })

  describe('deleteByToken', () => {
    it('should delete a refresh token by token string', async () => {
      // Arrange
      const user = await createPersistedUser()
      const token = buildRefreshToken({ userId: user.id })

      await repository.save({ refreshToken: token })

      // Act
      const result = await repository.deleteByToken({ token: token.token })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify token was deleted
      const findResult = await repository.findByToken({ token: token.token })
      expect(expectSuccess(findResult)).toBeNull()
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
      const user = await createPersistedUser()

      // Create 3 tokens
      for (let i = 0; i < 3; i++) {
        const token = buildRefreshToken({ userId: user.id })
        await repository.save({ refreshToken: token })
      }

      // Act
      const result = await repository.deleteByUserId({ userId: user.id })

      // Assert
      expect(expectSuccess(result)).toBe(3)

      // Verify empty
      const remaining = expectSuccess(await repository.findByUserId({ userId: user.id }))
      expect(remaining).toHaveLength(0)
    })

    it('should return 0 when user has no tokens', async () => {
      // Arrange
      const user = await createPersistedUser()

      // Act
      const result = await repository.deleteByUserId({ userId: user.id })

      // Assert
      expect(expectSuccess(result)).toBe(0)
    })
  })

  describe('deleteExpired', () => {
    it('should delete expired tokens', async () => {
      // Arrange
      const user = await createPersistedUser()

      // Create expired token
      const expiredToken = buildRefreshToken({ expiresAt: faker.date.past(), userId: user.id })

      // Create valid token
      const validToken = buildRefreshToken({ expiresAt: faker.date.future(), userId: user.id })

      await repository.save({ refreshToken: expiredToken })
      await repository.save({ refreshToken: validToken })

      // Act
      const result = await repository.deleteExpired()

      // Assert
      expect(expectSuccess(result)).toBe(1) // Should delete 1

      // Verify expired token gone
      const findExpired = await repository.findByToken({ token: expiredToken.token })
      expect(expectSuccess(findExpired)).toBeNull()

      // Verify valid token remains
      const findValid = await repository.findByToken({ token: validToken.token })
      expect(expectSuccess(findValid)).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle tokens with near-expiry dates', async () => {
      // Arrange
      const user = await createPersistedUser()

      // Expires in 1 second
      const nearExpiry = new Date(Date.now() + 1000)
      const token = buildRefreshToken({ expiresAt: nearExpiry, userId: user.id })

      await repository.save({ refreshToken: token })

      // Act & Assert - Should be found
      const found = expectSuccess(await repository.findByToken({ token: token.token }))
      expect(found).not.toBeNull()
    })

    it('should strictly respect branded types mapping', async () => {
      // This test ensures that the ID coming back from DB is treated as string at runtime
      // but was mapped correctly.
      const user = await createPersistedUser()
      const token = buildRefreshToken({ userId: user.id })

      await repository.save({ refreshToken: token })

      const found = expectSuccess(await repository.findByToken({ token: token.token }))

      // Verify strict equality
      expect(found?.id).toBe(token.id)
      expect(found?.userId).toBe(user.id)
      expect(typeof found?.id).toBe('string')
    })
  })
})
