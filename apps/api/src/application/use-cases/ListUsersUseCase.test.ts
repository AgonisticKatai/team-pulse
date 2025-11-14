import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Ok } from '../../domain/types/Result.js'
import { buildAdminUser, buildSuperAdminUser, buildUser, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
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
    listUsersUseCase = ListUsersUseCase.create({ userRepository })
  })

  describe('execute', () => {
    describe('successful listing', () => {
      it('should list all users successfully', async () => {
        // Arrange
        const mockUsers = [buildUser(), buildAdminUser()]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.users).toHaveLength(2)
        expect(data.total).toBe(2)
      })

      it('should call userRepository.findAll', async () => {
        // Arrange
        vi.mocked(userRepository.findAll).mockResolvedValue(Ok([]))

        // Act
        await listUsersUseCase.execute()

        // Assert
        expect(userRepository.findAll).toHaveBeenCalledTimes(1)
      })

      it('should return users without password hashes', async () => {
        // Arrange
        const mockUsers = [buildUser()]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users[0]).not.toHaveProperty('passwordHash')
        expect(data.users[0]).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: TEST_CONSTANTS.users.johnDoe.email,
          id: TEST_CONSTANTS.users.johnDoe.id,
          role: TEST_CONSTANTS.users.johnDoe.role,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should convert dates to ISO strings', async () => {
        // Arrange
        const mockUsers = [buildUser()]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users[0]).toMatchObject({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
        expect(typeof data.users[0]?.createdAt).toBe('string')
        expect(typeof data.users[0]?.updatedAt).toBe('string')
      })

      it('should handle empty user list', async () => {
        // Arrange
        vi.mocked(userRepository.findAll).mockResolvedValue(Ok([]))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(0)
        expect(data.total).toBe(0)
      })

      it('should handle single user', async () => {
        // Arrange
        const mockUsers = [buildSuperAdminUser()]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(1)
        expect(data.total).toBe(1)
        expect(data.users[0]?.email).toBe(TEST_CONSTANTS.users.superAdminUser.email)
      })

      it('should handle users with different roles', async () => {
        // Arrange
        const mockUsers = [buildUser(), buildAdminUser(), buildSuperAdminUser()]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(3)
        expect(data.users[0]?.role).toBe(TEST_CONSTANTS.users.johnDoe.role)
        expect(data.users[1]?.role).toBe(TEST_CONSTANTS.users.adminUser.role)
        expect(data.users[2]?.role).toBe(TEST_CONSTANTS.users.superAdminUser.role)
      })

      it('should return correct total count', async () => {
        // Arrange
        const mockUsers = Array.from({ length: 10 }, (_, i) =>
          buildUser({
            email: `user${i}@example.com`,
            id: `user-${i}`,
          }),
        )
        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.total).toBe(10)
        expect(data.users).toHaveLength(10)
      })

      it('should maintain user order from repository', async () => {
        // Arrange
        const mockUsers = [
          buildUser({ email: 'third@example.com', id: 'user-3' }),
          buildUser({ email: 'first@example.com', id: 'user-1' }),
          buildUser({ email: 'second@example.com', id: 'user-2' }),
        ]

        vi.mocked(userRepository.findAll).mockResolvedValue(Ok(mockUsers))

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        const data = expectSuccess(result)
        expect(data.users[0]?.email).toBe('third@example.com')
        expect(data.users[1]?.email).toBe('first@example.com')
        expect(data.users[2]?.email).toBe('second@example.com')
      })
    })

    describe('failure scenarios', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const mockError = {
          message: 'Database connection error',
          code: 'DB_CONN_ERR',
        }

        vi.mocked(userRepository.findAll).mockResolvedValueOnce({
          ok: false,
          error: mockError,
        } as any)

        // Act
        const result = await listUsersUseCase.execute()

        // Assert
        expect(result.ok).toBe(false)

        if (!result.ok) {
          expect(result.error).toBe(mockError)
        }
      })
    })
  })
})
