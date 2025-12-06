import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import { buildAdminUser, buildSuperAdminUser, buildUser } from '@infrastructure/testing/index.js'
import type { UserResponseDTO } from '@team-pulse/shared/dtos'
import { Err, Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectError, expectFirst, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ListUsersUseCase', () => {
  let listUsersUseCase: ListUsersUseCase
  let metricsService: IMetricsService
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
      findAllPaginated: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    }

    // Mock metrics service
    metricsService = {
      getContentType: vi.fn(),
      getMetrics: vi.fn(),
      recordDbError: vi.fn(),
      recordDbQuery: vi.fn(),
      recordHttpError: vi.fn(),
      recordHttpRequest: vi.fn(),
      recordLogin: vi.fn(),
      reset: vi.fn(),
      setTeamsTotal: vi.fn(),
      setUsersTotal: vi.fn(),
    }

    // Create use case instance
    listUsersUseCase = ListUsersUseCase.create({ metricsService, userRepository })
  })

  describe('execute', () => {
    describe('successful listing', () => {
      it('should list all users successfully', async () => {
        // Arrange
        const mockUsers = [buildUser(), buildAdminUser()]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 2, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.users).toHaveLength(2)
        expect(data.pagination.total).toBe(2)
        expect(data.pagination.page).toBe(1)
        expect(data.pagination.limit).toBe(10)
      })

      it('should call userRepository.findAllPaginated with default pagination', async () => {
        // Arrange
        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        expect(userRepository.findAllPaginated).toHaveBeenCalledTimes(1)
        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })
      })

      it('should return users without password hashes', async () => {
        // Arrange
        const mockUsers = [buildUser()]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 1, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        const firstUser = expectFirst(data.users)
        const mockUser = mockUsers[0]
        if (!mockUser) throw new Error('Mock user not found')

        expect(firstUser).not.toHaveProperty('passwordHash')
        expect(firstUser).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: TEST_CONSTANTS.users.johnDoe.email,
          id: mockUser.id.getValue(),
          role: TEST_CONSTANTS.users.johnDoe.role,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should convert dates to ISO strings', async () => {
        // Arrange
        const mockUsers = [buildUser()]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 1, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        const firstUser = expectFirst<UserResponseDTO>(data.users)
        expect(firstUser).toMatchObject({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
        expect(typeof firstUser.createdAt).toBe('string')
        expect(typeof firstUser.updatedAt).toBe('string')
      })

      it('should handle empty user list', async () => {
        // Arrange
        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(0)
        expect(data.pagination.total).toBe(0)
        expect(data.pagination.totalPages).toBe(0)
      })

      it('should handle single user', async () => {
        // Arrange
        const mockUsers = [buildSuperAdminUser()]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 1, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(1)
        expect(data.pagination.total).toBe(1)
        const firstUser = expectFirst<UserResponseDTO>(data.users)
        expect(firstUser.email).toBe(TEST_CONSTANTS.users.superAdminUser.email)
      })

      it('should handle users with different roles', async () => {
        // Arrange
        const mockUsers = [buildUser(), buildAdminUser(), buildSuperAdminUser()]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 3, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        expect(data.users).toHaveLength(3)
        const [firstUser, secondUser, thirdUser] = data.users
        expect(firstUser?.role).toBe(TEST_CONSTANTS.users.johnDoe.role)
        expect(secondUser?.role).toBe(TEST_CONSTANTS.users.adminUser.role)
        expect(thirdUser?.role).toBe(TEST_CONSTANTS.users.superAdminUser.role)
      })

      it('should return correct pagination metadata', async () => {
        // Arrange
        const mockUsers = Array.from({ length: 10 }, (_, i) =>
          buildUser({
            email: `user${i}@example.com`,
            id: `550e8400-e29b-41d4-a716-4466555000${i.toString().padStart(2, '0')}`,
          }),
        )
        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 10, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        expect(data.pagination.total).toBe(10)
        expect(data.users).toHaveLength(10)
        expect(data.pagination.page).toBe(1)
        expect(data.pagination.limit).toBe(10)
        expect(data.pagination.totalPages).toBe(1)
      })

      it('should maintain user order from repository', async () => {
        // Arrange
        const mockUsers = [
          buildUser({ email: TEST_CONSTANTS.testEmails.third, id: '550e8400-e29b-41d4-a716-446655550003' }),
          buildUser({ email: TEST_CONSTANTS.testEmails.first, id: '550e8400-e29b-41d4-a716-446655550001' }),
          buildUser({ email: TEST_CONSTANTS.testEmails.second, id: '550e8400-e29b-41d4-a716-446655550002' }),
        ]

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 3, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const data = expectSuccess(result)
        const [firstUser, secondUser, thirdUser] = data.users
        expect(firstUser?.email).toBe(TEST_CONSTANTS.testEmails.third)
        expect(secondUser?.email).toBe(TEST_CONSTANTS.testEmails.first)
        expect(thirdUser?.email).toBe(TEST_CONSTANTS.testEmails.second)
      })

      it('should respect custom page and limit parameters', async () => {
        // Arrange
        const mockUsers = [buildUser(), buildAdminUser()]
        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 20, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 5, page: 2 } })

        // Assert
        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 5, page: 2 })
        const data = expectSuccess(result)
        expect(data.pagination.page).toBe(2)
        expect(data.pagination.limit).toBe(5)
        expect(data.pagination.total).toBe(20)
        expect(data.pagination.totalPages).toBe(4)
      })
    })

    describe('failure scenarios', () => {
      it('should propagate repository errors', async () => {
        // Arrange
        const mockError = {
          code: 'DB_CONN_ERR',
          message: 'Database connection error',
        }

        vi.mocked(userRepository.findAllPaginated).mockResolvedValueOnce(Err(mockError as any))

        // Act
        const result = await listUsersUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        const error = expectError(result)
        expect(error).toBe(mockError)
      })
    })
  })
})
