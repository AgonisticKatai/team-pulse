import { faker } from '@faker-js/faker'
import type { Database } from '@infrastructure/database/connection.js'
import { DrizzleUserRepository } from '@infrastructure/database/repositories/DrizzleUserRepository.js'
import { refreshTokens } from '@infrastructure/database/schema.js'
import { buildUser } from '@infrastructure/testing/index.js' // 👈 Using Builder
import { setupTestEnvironment } from '@infrastructure/testing/test-helpers.js'
import { UserRoles } from '@team-pulse/shared/domain/value-objects'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { eq, sql } from 'drizzle-orm'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('DrizzleUserRepository - Integration Tests', () => {
  let repository: DrizzleUserRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = DrizzleUserRepository.create({ db })
  })

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  afterEach(async () => {
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)
  })

  describe('save', () => {
    it('should insert a new user successfully', async () => {
      // Arrange
      const user = buildUser() // Generates a completely valid, random user

      // Act
      const result = await repository.save({ user })

      // Assert
      const savedUser = expectSuccess(result)

      // Strict Equality Check (Branded Types match)
      expect(savedUser.id).toBe(user.id)
      expect(savedUser.email.getValue()).toBe(user.email.getValue())
      expect(savedUser.role.getValue()).toBe(user.role.getValue())

      expect(savedUser.createdAt).toBeInstanceOf(Date)
      expect(savedUser.updatedAt).toBeInstanceOf(Date)
    })

    it('should update an existing user (upsert)', async () => {
      // Arrange - Create and save initial user
      const user = buildUser({ role: UserRoles.User })
      await repository.save({ user })

      // Create updated version (Same ID, changed Role)
      // Preserve the data that should NOT change (createdAt, email)
      // and only change what we want to test (role, updatedAt)
      const updatedUser = buildUser({
        createdAt: user.createdAt, // 🛡️ Importante: Preserve creation date
        email: user.email.getValue(), // Preserve original email (optional, but clean)
        id: user.id,
        passwordHash: user.getPasswordHash(),
        role: UserRoles.Admin,
        updatedAt: new Date(),
      })

      // Act - Save updated user
      const result = await repository.save({ user: updatedUser })

      // Assert
      const savedUser = expectSuccess(result)
      expect(savedUser.role.getValue()).toBe(UserRoles.Admin)
      // Verify that the email remains the same (or the new one if you changed it)
      expect(savedUser.email.getValue()).toBe(updatedUser.email.getValue())
      // Verify that the original creation date was preserved
      expect(savedUser.createdAt.getTime()).toBe(user.createdAt.getTime())

      // Verify only one user exists
      const countResult = await repository.count()
      expect(expectSuccess(countResult)).toBe(1)
    })

    it('should handle database errors gracefully', async () => {
      // Arrange - Create user with invalid data that violates DB constraints
      // e.g. Trying to insert 'null' into a NOT NULL column manually
      const invalidUser = {
        toObject: () => ({
          email: null,
          id: null, // This will crash Drizzle/PG
        }),
      } as any

      // Act
      const result = await repository.save({ user: invalidUser })

      // Assert
      expectError(result)
    })
  })

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      // Arrange
      const user = buildUser()
      await repository.save({ user })

      // Act
      const result = await repository.findById({ id: user.id })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(user.id)
      expect(foundUser?.email.getValue()).toBe(user.email.getValue())
    })

    it('should return null when user does not exist', async () => {
      // Act
      // Use builder just to get a random valid ID structure
      const randomUser = buildUser()
      const result = await repository.findById({ id: randomUser.id })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      // Arrange
      const user = buildUser() // e.g. "Test@Example.com"
      await repository.save({ user })

      // Act - Search with lowercase
      const result = await repository.findByEmail({
        email: user.email.getValue().toLowerCase(),
      })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      // Value Object usually normalizes to lowercase anyway
      expect(foundUser?.id).toBe(user.id)
    })

    it('should return null when email does not exist', async () => {
      // Act
      const result = await repository.findByEmail({ email: faker.internet.email() })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).toBeNull()
    })

    it('should handle uppercase email search', async () => {
      // Arrange
      const email = faker.internet.email()
      const user = buildUser({ email })
      await repository.save({ user })

      // Act - Search with uppercase
      const result = await repository.findByEmail({ email: email.toUpperCase() })

      // Assert
      const foundUser = expectSuccess(result)
      expect(foundUser).not.toBeNull()
      expect(foundUser?.id).toBe(user.id)
    })
  })

  describe('existsByEmail', () => {
    it('should return true when email exists', async () => {
      // Arrange
      const user = buildUser()
      await repository.save({ user })

      // Act
      const result = await repository.existsByEmail({ email: user.email.getValue() })

      // Assert
      expect(expectSuccess(result)).toBe(true)
    })

    it('should return false when email does not exist', async () => {
      const result = await repository.existsByEmail({ email: faker.internet.email() })
      expect(expectSuccess(result)).toBe(false)
    })

    it('should be case-insensitive', async () => {
      // Arrange
      const email = faker.internet.email()
      const user = buildUser({ email })
      await repository.save({ user })

      // Act
      const result = await repository.existsByEmail({ email: email.toUpperCase() })

      // Assert
      expect(expectSuccess(result)).toBe(true)
    })
  })

  describe('findAll', () => {
    it('should return empty array when no users exist', async () => {
      const result = await repository.findAll()
      const users = expectSuccess(result)
      expect(users).toEqual([])
    })

    it('should return all users', async () => {
      // Arrange - Create 3 users in parallel
      const users = Array.from({ length: 3 }, () => buildUser())
      await Promise.all(users.map((u) => repository.save({ user: u })))

      // Act
      const result = await repository.findAll()

      // Assert
      const foundUsers = expectSuccess(result)
      expect(foundUsers).toHaveLength(3)
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create 15 users for pagination tests
      const users = Array.from({ length: 15 }, () => buildUser())
      await Promise.all(users.map((u) => repository.save({ user: u })))
    })

    it('should return first page with correct limit', async () => {
      const result = await repository.findAllPaginated({ limit: 5, page: 1 })
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(5)
      expect(data.total).toBe(15)
    })

    it('should return second page correctly', async () => {
      const result = await repository.findAllPaginated({ limit: 5, page: 2 })
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(5)
      expect(data.total).toBe(15)
    })

    it('should return partial last page', async () => {
      // Page 4 with limit 5 should be empty (15 / 5 = 3 full pages)
      const result = await repository.findAllPaginated({ limit: 5, page: 4 })
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(0)
      expect(data.total).toBe(15)
    })

    it('should return empty array for page beyond available data', async () => {
      const result = await repository.findAllPaginated({ limit: 10, page: 10 })
      const data = expectSuccess(result)
      expect(data.users).toHaveLength(0)
      expect(data.total).toBe(15)
    })
  })

  describe('delete', () => {
    it('should delete existing user and return true', async () => {
      // Arrange
      const user = buildUser()
      await repository.save({ user })

      // Verify exists
      const findBefore = await repository.findById({ id: user.id })
      expect(expectSuccess(findBefore)).not.toBeNull()

      // Act
      const result = await repository.delete({ id: user.id })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify deleted
      const findAfter = await repository.findById({ id: user.id })
      expect(expectSuccess(findAfter)).toBeNull()
    })

    it('should return false when deleting non-existent user', async () => {
      const randomUser = buildUser()
      const result = await repository.delete({ id: randomUser.id })
      expect(expectSuccess(result)).toBe(false)
    })

    it('should cascade delete related data', async () => {
      // This tests referential integrity
      const user = buildUser()
      await repository.save({ user })

      // Manually insert token via raw SQL to bypass repository (faster setup for this specific test)
      // Note: We use the user's real ID
      await db.execute(sql`
        INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at)
        VALUES ('550e8400-e29b-41d4-a716-446655500002', 'test-token', ${user.id}, NOW() + INTERVAL '7 days', NOW())
      `)

      // Verify token exists
      const tokensBefore = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, user.id))
      expect(tokensBefore).toHaveLength(1)

      // Act - Delete user
      const result = await repository.delete({ id: user.id })

      // Assert
      expect(expectSuccess(result)).toBe(true)

      // Verify tokens were cascade deleted
      const tokensAfter = await db.select().from(refreshTokens).where(eq(refreshTokens.userId, user.id))
      expect(tokensAfter).toHaveLength(0)
    })
  })

  describe('count', () => {
    it('should return 0 when no users exist', async () => {
      const result = await repository.count()
      expect(expectSuccess(result)).toBe(0)
    })

    it('should return correct count of users', async () => {
      // Arrange - Create 3 users
      const users = Array.from({ length: 3 }, () => buildUser())
      await Promise.all(users.map((u) => repository.save({ user: u })))

      // Act
      const result = await repository.count()

      // Assert
      expect(expectSuccess(result)).toBe(3)
    })
  })

  describe('edge cases', () => {
    it('should handle all user roles correctly', async () => {
      // Arrange
      const roles = Object.values(UserRoles)

      const users = roles.map((role) => buildUser({ role }))

      await Promise.all(users.map((u) => repository.save({ user: u })))

      // Assert
      const allUsers = expectSuccess(await repository.findAll())
      expect(allUsers).toHaveLength(3)

      const foundRoles = allUsers.map((u) => u.role.getValue())
      expect(foundRoles).toContain(UserRoles.User)
      expect(foundRoles).toContain(UserRoles.Admin)
      expect(foundRoles).toContain(UserRoles.SuperAdmin)
    })

    it('should preserve timestamps correctly', async () => {
      // Arrange
      const createdAt = new Date('2024-01-01T00:00:00Z')
      const user = buildUser({ createdAt })

      // Act
      await repository.save({ user })

      // Assert
      const foundUser = expectSuccess(await repository.findById({ id: user.id }))
      expect(foundUser).not.toBeNull()
      expect(foundUser?.createdAt.getTime()).toBe(createdAt.getTime())
    })
  })
})
