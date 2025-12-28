import { faker } from '@faker-js/faker'
import { KyselyUserRepository } from '@features/users/infrastructure/repositories/user/KyselyUserRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import { buildUser } from '@shared/testing/builders/user-builders.js'
import { setupTestEnvironment } from '@shared/testing/helpers/test-helpers.js'
import { USER_ROLES, UserId } from '@team-pulse/shared'
import { expectSuccess } from '@team-pulse/shared/testing'
import { sql } from 'kysely'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('KyselyUserRepository', () => {
  let repository: KyselyUserRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = KyselyUserRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean database for test isolation
    await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`.execute(db)
  })

  describe('Factory Pattern', () => {
    it('should create repository instance with factory method', () => {
      // Act
      const repo = KyselyUserRepository.create({ db })

      // Assert
      expect(repo).toBeInstanceOf(KyselyUserRepository)
    })
  })

  describe('save', () => {
    it('should save a new user', async () => {
      // Arrange
      const user = buildUser({
        email: faker.internet.email(),
        role: USER_ROLES.GUEST,
      })

      // Act
      const result = await repository.save({ user })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.id).toBe(user.id)
      expect(saved.email.value).toBe(user.email.value)
      expect(saved.role.value).toBe(user.role.value)
      expect(saved.getPasswordHash()).toBe(user.getPasswordHash())
    })

    it('should update existing user on conflict (upsert)', async () => {
      // Arrange - Save initial user
      const userId = UserId.random()
      const initialUser = buildUser({
        email: faker.internet.email(),
        id: userId,
        role: USER_ROLES.GUEST,
      })

      await repository.save({ user: initialUser })

      // Act - Update user
      const updatedUser = buildUser({
        createdAt: initialUser.createdAt,
        email: faker.internet.email(),
        id: userId, // Same ID
        passwordHash: faker.internet.password(),
        role: USER_ROLES.ADMIN,
      })

      const result = await repository.save({ user: updatedUser })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.email.value).toBe(updatedUser.email.value)
      expect(saved.role.value).toBe(USER_ROLES.ADMIN)
      expect(saved.getPasswordHash()).toBe(updatedUser.getPasswordHash())

      // Verify only one user exists
      const count = expectSuccess(await repository.count())
      expect(count).toBe(1)
    })

    it('should preserve user data integrity on upsert', async () => {
      // Arrange - Create user with specific role
      const userId = UserId.random()
      const user = buildUser({
        id: userId,
        role: USER_ROLES.GUEST,
      })

      await repository.save({ user })

      // Act - Update with new role
      const updatedUser = buildUser({
        createdAt: user.createdAt,
        id: userId,
        passwordHash: faker.internet.password(),
        role: USER_ROLES.ADMIN,
      })

      const result = await repository.save({ user: updatedUser })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.role.value).toBe(USER_ROLES.ADMIN)
      expect(saved.getPasswordHash()).toBe(updatedUser.getPasswordHash())
    })
  })

  describe('findById', () => {
    it('should find user by id', async () => {
      // Arrange
      const userId = UserId.random()
      const user = buildUser({
        email: faker.internet.email(),
        id: userId,
      })

      await repository.save({ user })

      // Act
      const result = await repository.findById({ id: userId })

      // Assert
      const found = expectSuccess(result)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(userId)
      expect(found?.email.value).toBe(user.email.value)
    })

    it('should return null when user not found', async () => {
      // Act
      const result = await repository.findById({ id: UserId.random() })

      // Assert
      const found = expectSuccess(result)
      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      // Arrange
      const email = faker.internet.email().toUpperCase() // Test case-insensitivity
      const userId = UserId.random()
      const user = buildUser({
        email,
        id: userId,
      })

      await repository.save({ user })

      // Act - Search with different case
      const result = await repository.findByEmail({ email: email.toLowerCase() })

      // Assert
      const found = expectSuccess(result)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(userId)
      expect(found?.email.value.toLowerCase()).toBe(email.toLowerCase())
    })

    it('should return null when email not found', async () => {
      // Act
      const result = await repository.findByEmail({ email: faker.internet.email() })

      // Assert
      const found = expectSuccess(result)
      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should find all users', async () => {
      // Arrange
      const user1 = buildUser({ role: USER_ROLES.GUEST })
      const user2 = buildUser({ role: USER_ROLES.ADMIN })

      await repository.save({ user: user1 })
      await repository.save({ user: user2 })

      // Act
      const result = await repository.findAll()

      // Assert
      const users = expectSuccess(result)
      expect(users).toHaveLength(2)
      expect(users.map((u) => u.id)).toContain(user1.id)
      expect(users.map((u) => u.id)).toContain(user2.id)
    })

    it('should return empty array when no users exist', async () => {
      // Act
      const result = await repository.findAll()

      // Assert
      const users = expectSuccess(result)
      expect(users).toHaveLength(0)
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create 5 users for pagination tests
      for (let i = 1; i <= 5; i++) {
        const user = buildUser({
          email: faker.internet.email(),
        })
        await repository.save({ user })
      }
    })

    it('should return first page of users', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 1 })

      // Assert
      const { users, total } = expectSuccess(result)
      expect(users).toHaveLength(2)
      expect(total).toBe(5)
    })

    it('should return second page of users', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 2 })

      // Assert
      const { users, total } = expectSuccess(result)
      expect(users).toHaveLength(2)
      expect(total).toBe(5)
    })

    it('should return last page with remaining users', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 3 })

      // Assert
      const { users, total } = expectSuccess(result)
      expect(users).toHaveLength(1) // Only 1 user on last page
      expect(total).toBe(5)
    })

    it('should return empty array for page beyond total', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 10 })

      // Assert
      const { users, total } = expectSuccess(result)
      expect(users).toHaveLength(0)
      expect(total).toBe(5)
    })
  })

  describe('delete', () => {
    it('should delete user and return true', async () => {
      // Arrange
      const userId = UserId.random()
      const user = buildUser({ id: userId })

      await repository.save({ user })

      // Act
      const result = await repository.delete({ id: userId })

      // Assert
      const deleted = expectSuccess(result)
      expect(deleted).toBe(true)

      // Verify user no longer exists
      const found = expectSuccess(await repository.findById({ id: userId }))
      expect(found).toBeNull()
    })

    it('should return false when user does not exist', async () => {
      // Act
      const result = await repository.delete({ id: UserId.random() })

      // Assert
      const deleted = expectSuccess(result)
      expect(deleted).toBe(false)
    })
  })

  describe('existsByEmail', () => {
    it('should return true when user exists (case-insensitive)', async () => {
      // Arrange
      const email = faker.internet.email().toUpperCase()
      const user = buildUser({ email })

      await repository.save({ user })

      // Act
      const result = await repository.existsByEmail({ email: email.toLowerCase() })

      // Assert
      const exists = expectSuccess(result)
      expect(exists).toBe(true)
    })

    it('should return false when user does not exist', async () => {
      // Act
      const result = await repository.existsByEmail({ email: faker.internet.email() })

      // Assert
      const exists = expectSuccess(result)
      expect(exists).toBe(false)
    })
  })

  describe('count', () => {
    it('should return 0 when no users exist', async () => {
      // Act
      const result = await repository.count()

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(0)
    })

    it('should return correct count of users', async () => {
      // Arrange - Create 3 users
      for (let i = 1; i <= 3; i++) {
        const user = buildUser()
        await repository.save({ user })
      }

      // Act
      const result = await repository.count()

      // Assert
      const count = expectSuccess(result)
      expect(count).toBe(3)
    })
  })
})
