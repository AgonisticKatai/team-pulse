import { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import { faker } from '@faker-js/faker'
import { buildUser } from '@shared/testing/index.js'
import type { PaginationQueryDTO } from '@team-pulse/shared'
import { Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
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
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return paginated users with default parameters', async () => {
        // Arrange
        const dto = {} satisfies Partial<PaginationQueryDTO>
        const mockUsers = Array.from({ length: 5 }, () => buildUser())
        const mockTotal = 25

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: mockUsers }))

        // Act
        const result = await listUsersUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })

        expect(response.data).toHaveLength(5)
        expect(response.data[0]?.id).toBe(mockUsers[0]?.id)
        expect(response.meta).toEqual({
          hasNext: true,
          hasPrev: false,
          limit: 10,
          page: 1,
          total: mockTotal,
          totalPages: 3,
        })
      })

      it('should return paginated users with custom parameters', async () => {
        // Arrange
        const dto = { limit: 20, page: 2 } satisfies PaginationQueryDTO
        const mockUsers = Array.from({ length: 10 }, () => buildUser())
        const mockTotal = 100

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: mockUsers }))

        // Act
        const response = expectSuccess(await listUsersUseCase.execute({ dto }))

        // Assert
        expect(userRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 20, page: 2 })

        expect(response.meta.page).toBe(2)
        expect(response.meta.limit).toBe(20)
        expect(response.meta.totalPages).toBe(5)
      })

      it('should handle empty result set', async () => {
        // Arrange
        const dto = { limit: 10, page: 1 } satisfies PaginationQueryDTO

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        const response = expectSuccess(await listUsersUseCase.execute({ dto }))

        // Assert
        expect(response.data).toEqual([])
        expect(response.meta.total).toBe(0)
        expect(response.meta.totalPages).toBe(1)
      })

      it('should update user metrics with total count', async () => {
        // Arrange
        const mockTotal = faker.number.int({ max: 500, min: 50 })

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: mockTotal, users: [] }))

        // Act
        await listUsersUseCase.execute({ dto: {} })

        // Assert
        expect(metricsService.setUsersTotal).toHaveBeenCalledWith({ count: mockTotal })
        expect(metricsService.setUsersTotal).toHaveBeenCalledTimes(1)
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should sanitize invalid pagination parameters instead of failing', async () => {
        // Arrange
        const dto = { limit: 10, page: -1 } satisfies PaginationQueryDTO

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Ok({ total: 0, users: [] }))

        // Act
        const response = expectSuccess(await listUsersUseCase.execute({ dto }))

        // Assert
        expect(response.meta.page).toBe(1)
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when repository fails', async () => {
        // Arrange
        const dbError = RepositoryError.forOperation({ message: faker.lorem.sentence(), operation: 'findAllPaginated' })

        vi.mocked(userRepository.findAllPaginated).mockResolvedValue(Err(dbError))

        // Act
        const result = await listUsersUseCase.execute({ dto: {} })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(metricsService.setUsersTotal).not.toHaveBeenCalled()
      })
    })
  })
})
