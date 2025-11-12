import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import {
  buildAdminUser,
  buildSuperAdminUser,
  buildUser,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { ListUsersUseCase } from './ListUsersUseCase.js'

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
      const mockUsers = [buildUser(), buildAdminUser()]

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
      const mockUsers = [buildUser()]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users[0]).not.toHaveProperty('passwordHash')
      expect(result.users[0]).toEqual({
        createdAt: TEST_CONSTANTS.MOCK_DATE_ISO,
        email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
        id: TEST_CONSTANTS.USERS.JOHN_DOE.id,
        role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
        updatedAt: TEST_CONSTANTS.MOCK_DATE_ISO,
      })
    })

    it('should convert dates to ISO strings', async () => {
      // Arrange
      const mockUsers = [buildUser()]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users[0]).toMatchObject({
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(typeof result.users[0]?.createdAt).toBe('string')
      expect(typeof result.users[0]?.updatedAt).toBe('string')
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
      const mockUsers = [buildSuperAdminUser()]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.users[0]?.email).toBe(TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.email)
    })

    it('should handle users with different roles', async () => {
      // Arrange
      const mockUsers = [buildUser(), buildAdminUser(), buildSuperAdminUser()]

      vi.mocked(userRepository.findAll).mockResolvedValue(mockUsers)

      // Act
      const result = await listUsersUseCase.execute()

      // Assert
      expect(result.users).toHaveLength(3)
      expect(result.users[0]?.role).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.role)
      expect(result.users[1]?.role).toBe(TEST_CONSTANTS.USERS.ADMIN_USER.role)
      expect(result.users[2]?.role).toBe(TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role)
    })

    it('should return correct total count', async () => {
      // Arrange
      const mockUsers = Array.from({ length: 10 }, (_, i) =>
        buildUser({
          email: `user${i}@example.com`,
          id: `user-${i}`,
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
        buildUser({ email: 'third@example.com', id: 'user-3' }),
        buildUser({ email: 'first@example.com', id: 'user-1' }),
        buildUser({ email: 'second@example.com', id: 'user-2' }),
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
