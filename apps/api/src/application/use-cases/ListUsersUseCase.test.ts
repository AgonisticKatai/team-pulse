import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import { faker } from '@faker-js/faker'
import { buildUser } from '@infrastructure/testing/index.js'
import type { PaginationQuery } from '@team-pulse/shared'
import { Err, Ok, RepositoryError, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ListUsersUseCase', () => {
  let listUsersUseCase: ListUsersUseCase
  let userRepository: IUserRepository
  let metricsService: IMetricsService

  beforeEach(() => {
    vi.clearAllMocks()

    userRepository = { findAllPaginated: vi.fn() } as unknown as IUserRepository
    metricsService = { setUsersTotal: vi.fn() } as unknown as IMetricsService

    listUsersUseCase = ListUsersUseCase.create({ metricsService, userRepository })
  })

  describe('execute', () => {
    describe('successful retrieval', () => {
      it('should return paginated users with default parameters', async () => {
        // Arrange
        // No params provided in DTO, should default to page 1, limit 10
        const dto: PaginationQuery = {}

        // Generate random users dynamically
        const mockUsers = Array.from({ length: 5 }, () => buildUser())
        const mockTotal = 25 // Arbitrary total in DB

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        // 1. Verify Repository Call (Defaults)
        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })

        // 2. Verify DTO Mapping
        expect(response.users).toHaveLength(5)
        // Verify we are returning DTOs, not Entities (simple check: ID should be string)
        expect(response.users[0]?.id).toBe(mockUsers[0]?.id)

        // 3. Verify Pagination Metadata (Calculated by Domain VO)
        expect(response.pagination).toEqual({ limit: 10, page: 1, total: mockTotal, totalPages: 3 })
      })

      it('should return paginated users with custom parameters', async () => {
        // Arrange
        const dto: PaginationQuery = { limit: 20, page: 2 }

        const mockUsers = Array.from({ length: 10 }, () => buildUser())
        const mockTotal = 100

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: mockUsers }))

        // Act
        const response = expectSuccess(await listUsersUseCase.execute({ dto }))

        // Assert
        // Verify custom params were passed to repo
        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 20, page: 2 })

        expect(response.pagination.page).toBe(2)
        expect(response.pagination.limit).toBe(20)
        expect(response.pagination.totalPages).toBe(5) // 100 / 20 = 5
      })

      it('should handle empty result set', async () => {
        // Arrange
        const dto: PaginationQuery = { limit: 10, page: 1 }

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        const response = expectSuccess(await listUsersUseCase.execute({ dto }))

        // Assert
        expect(response.users).toEqual([])
        expect(response.pagination.total).toBe(0)
        expect(response.pagination.totalPages).toBe(0)
      })

      it('should update user metrics with total count', async () => {
        // Arrange
        const mockTotal = faker.number.int({ max: 500, min: 50 })

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: [] }))

        // Act
        await listUsersUseCase.execute({ dto: {} })

        // Assert
        // Verify side effect: the service must update the gauge
        expect(metricsService.setUsersTotal).toHaveBeenCalledWith({ count: mockTotal })
        expect(metricsService.setUsersTotal).toHaveBeenCalledTimes(1)
      })
    })

    describe('error cases', () => {
      it('should return RepositoryError when repository fails', async () => {
        // Arrange
        const dbError = RepositoryError.forOperation({ message: faker.lorem.sentence(), operation: 'findAllPaginated' })

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Err(dbError))

        // Act
        const result = await listUsersUseCase.execute({ dto: {} })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)

        // Metrics should NOT be updated on error
        expect(metricsService.setUsersTotal).not.toHaveBeenCalled()
      })

      it('should return ValidationError if Pagination Value Object creation fails', async () => {
        // Arrange
        // We force invalid inputs via DTO that might bypass repo check
        // but fail domain validation (e.g., negative page)
        const dto: PaginationQuery = { limit: 10, page: -1 }

        // Even if repo ignores it, the domain layer protects the response
        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        const result = await listUsersUseCase.execute({ dto })

        // Assert
        // The Use Case calls Pagination.create({ page: -1 ... }) which should fail
        expectErrorType({ errorType: ValidationError, result })
      })
    })
  })
})
