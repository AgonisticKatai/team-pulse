import { eq, sql } from 'drizzle-orm'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { User } from '../../../domain/models/User.js'
import { hashPassword } from '../../auth/password-utils.js'
import { expectSuccess, TEST_CONSTANTS } from '../../testing/index.js'
import { setupTestEnvironment } from '../../testing/test-helpers.js'
import type { Database } from '../connection.js'
import { refreshTokens } from '../schema.js'
import { DrizzleUserRepository } from './DrizzleUserRepository.js'

describe('DrizzleUserRepository - Integration Tests', () => {
  let repository: DrizzleUserRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = DrizzleUserRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean database before each test
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  afterEach(async () => {
    // Clean database after each test
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  describe('save', () => {
    it('should insert a new user successfully', async () => {
      // Arrange
      const userResult = User.create({
        email: TEST_CONSTANTS.users.johnDoe.email,
        id: TEST_CONSTANTS.users.johnDoe.id,
        passwordHash: await hashPassword(TEST_CONSTANTS.users.johnDoe.password),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return
      const user = userResult.value

      // Act
      const result = await repository.save({ user })

      // Assert
      const savedUser = expectSuccess(result)
      expect(savedUser.id.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.id)
      expect(savedUser.email.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.email)
      expect(savedUser.role.getValue()).toBe('USER')
    })

    it('should update an existing user (upsert)', async () => {
      // Arrange - Create and save initial user
      const initialUserResult = User.create({
        email: 'initial@test.com',
        id: 'test-user-1',
        passwordHash: await hashPassword('InitialPassword123!'),
        role: 'USER',
      })
      expect(initialUserResult.ok).toBe(true)
      if (!initialUserResult.ok) return

      await repository.save({ user: initialUserResult.value })

      // Create updated version
      const updatedUserResult = User.create({
        createdAt: initialUserResult.value.createdAt,
        email: 'updated@test.com',
        id: 'test-user-1', // Same ID
        passwordHash: await hashPassword('UpdatedPassword123!'),
        role: 'ADMIN', // Changed role
        updatedAt: new Date(),
      })
      expect(updatedUserResult.ok).toBe(true)
      if (!updatedUserResult.ok) return

      // Act - Save updated user
      const result = await repository.save({ user: updatedUserResult.value })

      // Assert
      const savedUser = expectSuccess(result)
      expect(savedUser.email.getValue()).toBe('updated@test.com')
      expect(savedUser.role.getValue()).toBe('ADMIN')

      // Verify only one user exists
      const countResult = await repository.count()
      expect(expectSuccess(countResult)).toBe(1)
    })

    it('should handle database errors gracefully', async () => {
      // Arrange - Create user with invalid data that will fail DB constraints
      const invalidUser = {
        email: 'test@test.com',
        id: 'test-id',
        passwordHash: 'hash',
        role: 'INVALID_ROLE' as any, // Invalid role
      } as any

      // Act
      const result = await repository.save({ user: invalidUser })

      // Assert
      expect(result.ok).toBe(false)
    })
  })

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      // Arrange - Save a user first
      const userResult = User.create({
        email: TEST_CONSTANTS.users.johnDoe.email,
        id: TEST_CONSTANTS.users.johnDoe.id,
        passwordHash: await hashPassword(TEST_CONSTANTS.users.johnDoe.password),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Act
      const result = await repository.findById({ id: TEST_CONSTANTS.users.johnDoe.id })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.id.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.id)
      expect(foundUser?.email.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.email)
    })

    it('should return null when user does not exist', async () => {
      // Act
      const result = await repository.findById({ id: 'non-existent-id' })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      // Arrange - Save a user
      const userResult = User.create({
        email: 'Test@Example.com',
        id: 'test-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Act - Search with different case
      const result = await repository.findByEmail({ email: 'test@example.com' })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.email.getValue().toLowerCase()).toBe('test@example.com')
    })

    it('should return null when email does not exist', async () => {
      // Act
      const result = await repository.findByEmail({ email: 'nonexistent@test.com' })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).toBeNull()
    })

    it('should handle uppercase email search', async () => {
      // Arrange
      const userResult = User.create({
        email: 'lowercase@test.com',
        id: 'test-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Act - Search with uppercase
      const result = await repository.findByEmail({ email: 'LOWERCASE@TEST.COM' })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.email.getValue()).toBe('lowercase@test.com')
    })
  })

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      // Arrange
      const userResult = User.create({
        email: 'exists@test.com',
        id: 'test-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Act
      const result = await repository.existsByEmail({ email: 'exists@test.com' })

      // Assert
      expect(expectSuccess(result)).toBe(true)
    })

    it('should return false when email does not exist', async () => {
      // Act
      const result = await repository.existsByEmail({ email: 'notexists@test.com' })

      // Assert
      expect(expectSuccess(result)).toBe(false)
    })

    it('should be case-insensitive', async () => {
      // Arrange
      const userResult = User.create({
        email: 'CaseSensitive@Test.com',
        id: 'test-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Act
      const result = await repository.existsByEmail({ email: 'casesensitive@test.com' })

      // Assert
      expect(expectSuccess(result)).toBe(true)
    })
  })

  describe('findAll', () => {
    it('should return empty array when no users exist', async () => {
      // Act
      const result = await repository.findAll()

      // Assert
      const users = expectSuccess(result)
      expect(users).toEqual([])
    })

    it('should return all users', async () => {
      // Arrange - Create multiple users
      const user1Result = User.create({
        email: 'user1@test.com',
        id: 'user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      const user2Result = User.create({
        email: 'user2@test.com',
        id: 'user-2',
        passwordHash: await hashPassword('Password123!'),
        role: 'ADMIN',
      })
      const user3Result = User.create({
        email: 'user3@test.com',
        id: 'user-3',
        passwordHash: await hashPassword('Password123!'),
        role: 'SUPER_ADMIN',
      })

      expect(user1Result.ok && user2Result.ok && user3Result.ok).toBe(true)
      if (!(user1Result.ok && user2Result.ok && user3Result.ok)) return

      await repository.save({ user: user1Result.value })
      await repository.save({ user: user2Result.value })
      await repository.save({ user: user3Result.value })

      // Act
      const result = await repository.findAll()

      // Assert
      const users = expectSuccess(result)
      expect(users).toHaveLength(3)
      expect(users.map((u) => u.email.getValue())).toContain('user1@test.com')
      expect(users.map((u) => u.email.getValue())).toContain('user2@test.com')
      expect(users.map((u) => u.email.getValue())).toContain('user3@test.com')
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create 15 users for pagination tests
      for (let i = 1; i <= 15; i++) {
        const userResult = User.create({
          email: `user${i}@test.com`,
          id: `user-${i}`,
          passwordHash: await hashPassword('Password123!'),
          role: 'USER',
        })
        expect(userResult.ok).toBe(true)
        if (!userResult.ok) continue

        await repository.save({ user: userResult.value })
      }
    })

    it('should return first page with correct limit', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 5, page: 1 })

      // Assert
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(5)
      expect(data.total).toBe(15)
    })

    it('should return second page correctly', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 5, page: 2 })

      // Assert
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(5)
      expect(data.total).toBe(15)
    })

    it('should return partial last page', async () => {
      // Act - Page 4 with limit 5 should have 0 items (15 / 5 = 3 pages)
      const result = await repository.findAllPaginated({ limit: 5, page: 4 })

      // Assert
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(0)
      expect(data.total).toBe(15)
    })

    it('should return empty array for page beyond available data', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 10, page: 10 })

      // Assert
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(0)
      expect(data.total).toBe(15)
    })

    it('should handle limit larger than total', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 100, page: 1 })

      // Assert
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(15)
      expect(data.total).toBe(15)
    })
  })

  describe('delete', () => {
    it('should delete existing user and return true', async () => {
      // Arrange - Create and save user
      const userResult = User.create({
        email: 'todelete@test.com',
        id: 'delete-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Verify user exists
      const findBefore = await repository.findById({ id: 'delete-user-1' })
      expect(expectSuccess(findBefore)).not.toBeNull()

      // Act
      const result = await repository.delete({ id: 'delete-user-1' })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify user is deleted
      const findAfter = await repository.findById({ id: 'delete-user-1' })
      expect(expectSuccess(findAfter)).toBeNull()
    })

    it('should return false when deleting non-existent user', async () => {
      // Act
      const result = await repository.delete({ id: 'non-existent-id' })

      // Assert
      expect(expectSuccess(result)).toBe(false)
    })

    it('should cascade delete related data', async () => {
      // This test verifies that cascade delete works for relationships
      // Note: In the current schema, users have refresh_tokens with cascade delete

      // Arrange - Create user
      const userResult = User.create({
        email: 'cascade@test.com',
        id: 'cascade-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      await repository.save({ user: userResult.value })

      // Insert a refresh token for this user (to test cascade)
      await db.execute(sql`
        INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at)
        VALUES ('token-1', 'test-token', 'cascade-user-1', NOW() + INTERVAL '7 days', NOW())
      `)

      // Verify token exists
      const tokensBefore = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, 'cascade-user-1'))
      expect(tokensBefore).toHaveLength(1)

      // Act - Delete user
      const result = await repository.delete({ id: 'cascade-user-1' })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify tokens were cascade deleted
      const tokensAfter = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, 'cascade-user-1'))
      expect(tokensAfter).toHaveLength(0)
    })
  })

  describe('count', () => {
    it('should return 0 when no users exist', async () => {
      // Act
      const result = await repository.count()

      // Assert
      expect(expectSuccess(result)).toBe(0)
    })

    it('should return correct count of users', async () => {
      // Arrange - Create 3 users
      for (let i = 1; i <= 3; i++) {
        const userResult = User.create({
          email: `count${i}@test.com`,
          id: `count-user-${i}`,
          passwordHash: await hashPassword('Password123!'),
          role: 'USER',
        })
        expect(userResult.ok).toBe(true)
        if (!userResult.ok) continue

        await repository.save({ user: userResult.value })
      }

      // Act
      const result = await repository.count()

      // Assert
      expect(expectSuccess(result)).toBe(3)
    })

    it('should update count after deletion', async () => {
      // Arrange - Create 2 users
      const user1Result = User.create({
        email: 'count1@test.com',
        id: 'count-user-1',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      const user2Result = User.create({
        email: 'count2@test.com',
        id: 'count-user-2',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })

      expect(user1Result.ok && user2Result.ok).toBe(true)
      if (!(user1Result.ok && user2Result.ok)) return

      await repository.save({ user: user1Result.value })
      await repository.save({ user: user2Result.value })

      // Verify initial count
      const countBefore = await repository.count()
      expect(expectSuccess(countBefore)).toBe(2)

      // Act - Delete one user
      await repository.delete({ id: 'count-user-1' })

      // Assert
      const countAfter = await repository.count()
      expect(expectSuccess(countAfter)).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should handle all user roles correctly', async () => {
      // Arrange & Act - Create users with all roles
      const roles: Array<'USER' | 'ADMIN' | 'SUPER_ADMIN'> = ['USER', 'ADMIN', 'SUPER_ADMIN']

      for (const role of roles) {
        const userResult = User.create({
          email: `${role.toLowerCase()}@test.com`,
          id: `${role.toLowerCase()}-user`,
          passwordHash: await hashPassword('Password123!'),
          role,
        })
        expect(userResult.ok).toBe(true)
        if (!userResult.ok) continue

        const saveResult = await repository.save({ user: userResult.value })
        expect(saveResult.ok).toBe(true)
      }

      // Assert - Find all and verify roles
      const allUsers = await repository.findAll()
      const users = expectSuccess(allUsers)

      expect(users).toHaveLength(3)
      expect(users.map((u) => u.role.getValue())).toContain('USER')
      expect(users.map((u) => u.role.getValue())).toContain('ADMIN')
      expect(users.map((u) => u.role.getValue())).toContain('SUPER_ADMIN')
    })

    it('should preserve timestamps correctly', async () => {
      // Arrange
      const createdAt = new Date('2024-01-01T00:00:00Z')
      const userResult = User.create({
        createdAt,
        email: 'timestamp@test.com',
        id: 'timestamp-user',
        passwordHash: await hashPassword('Password123!'),
        role: 'USER',
      })
      expect(userResult.ok).toBe(true)
      if (!userResult.ok) return

      // Act
      await repository.save({ user: userResult.value })

      // Assert
      const foundResult = await repository.findById({ id: 'timestamp-user' })
      const foundUser = expectSuccess(foundResult)

      expect(foundUser).not.toBeNull()
      expect(foundUser?.createdAt.getTime()).toBe(createdAt.getTime())
      expect(foundUser?.updatedAt).toBeDefined()
    })
  })
})
