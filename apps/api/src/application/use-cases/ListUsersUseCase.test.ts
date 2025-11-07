import { beforeEach, describe, expect, it, vi } from 'vitest'
import { User } from '../../domain/models/User.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { expectSuccess } from '../../infrastructure/testing/result-helpers.js'
import { ListUsersUseCase } from './ListUsersUseCase.js'

// Helper to create user from persistence and unwrap Result
function createUser(data: Parameters<typeof User.create>[0]): User {
  return expectSuccess(User.create(data))
}

describe('ListUsersUseCase', () => {
  let listUsersUseCase: ListUsersUseCase
  let userRepository: IUserRepository

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock repository
    userRepository = {
      count: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    listUsersUseCase = new ListUsersUseCase(userRepository)
  })

  describe('execute', () => {
    it('should list all users successfully', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'user1@example.com',
          id: 'user-1',
          passwordHash: 'hash1',
          role: 'USER',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
        createUser({
          createdAt: new Date('2025-01-02T00:00:00Z'),
          email: 'user2@example.com',
          id: 'user-2',
          passwordHash: 'hash2',
          role: 'ADMIN',
          updatedAt: new Date('2025-01-02T00:00:00Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result).toBeDefined()
      expect(result.users).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should call userRepository.findAll', async () => {
      // Arrange
      vi.mocked(userRepository.findAll).mockResolvedValue([])

      // Act
      await listUsersUseCase.execute()

      // Assert
      expect(userRepository.findAll).toHaveBeenCalledTimes(1)
    })

    it('should return users without password hashes', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'user1@example.com',
          id: 'user-1',
          passwordHash: 'secret-hash-1',
          role: 'USER',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users[0]).not.toHaveProperty('passwordHash')
      expect(result.users[0]).toEqual({
        createdAt: '2025-01-01T00:00:00.000Z',
        email: 'user1@example.com',
        id: 'user-1',
        role: 'USER',
        updatedAt: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should convert dates to ISO strings', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-01T10:30:45Z'),
          email: 'user1@example.com',
          id: 'user-1',
          passwordHash: 'hash1',
          role: 'USER',
          updatedAt: new Date('2025-01-02T14:20:30Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      const firstUser = result.users[0]
      expect(firstUser).toBeDefined()
      expect(typeof firstUser?.createdAt).toBe('string')
      expect(typeof firstUser?.updatedAt).toBe('string')
      expect(firstUser?.createdAt).toBe('2025-01-01T10:30:45.000Z')
      expect(firstUser?.updatedAt).toBe('2025-01-02T14:20:30.000Z')
    })

    it('should handle empty user list', async () => {
      // Arrange
      vi.mocked(userRepository.findAll).mockResolvedValue([])

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle single user', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'only@example.com',
          id: 'user-1',
          passwordHash: 'hash1',
          role: 'SUPER_ADMIN',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.users[0]?.email).toBe('only@example.com')
    })

    it('should handle users with different roles', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'user@example.com',
          id: 'user-1',
          passwordHash: 'hash1',
          role: 'USER',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'admin@example.com',
          id: 'admin-1',
          passwordHash: 'hash2',
          role: 'ADMIN',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'super@example.com',
          id: 'super-1',
          passwordHash: 'hash3',
          role: 'SUPER_ADMIN',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users).toHaveLength(3)
      expect(result.users[0]?.role).toBe('USER')
      expect(result.users[1]?.role).toBe('ADMIN')
      expect(result.users[2]?.role).toBe('SUPER_ADMIN')
    })

    it('should return correct total count', async () => {
      // Arrange
      const mockUsers = Array.from({ length: 10 }, (_, i) =>
        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: `user${i}@example.com`,
          id: `user-${i}`,
          passwordHash: `hash${i}`,
          role: 'USER',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
      )
      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.total).toBe(10)
      expect(result.users).toHaveLength(10)
    })

    it('should maintain user order from repository', async () => {
      // Arrange
      const mockUsers = [
        createUser({
          createdAt: new Date('2025-01-03T00:00:00Z'),
          email: 'third@example.com',
          id: 'user-3',
          passwordHash: 'hash3',
          role: 'USER',
          updatedAt: new Date('2025-01-03T00:00:00Z'),
        }),

        createUser({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'first@example.com',
          id: 'user-1',
          passwordHash: 'hash1',
          role: 'USER',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        }),
        createUser({
          createdAt: new Date('2025-01-02T00:00:00Z'),
          email: 'second@example.com',
          id: 'user-2',
          passwordHash: 'hash2',
          role: 'USER',
          updatedAt: new Date('2025-01-02T00:00:00Z'),
        }),
      ]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users[0]?.email).toBe('third@example.com')
      expect(result.users[1]?.email).toBe('first@example.com')
      expect(result.users[2]?.email).toBe('second@example.com')
    })
  })
})
