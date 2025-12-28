import { faker } from '@faker-js/faker'
import { ListTeamsUseCase } from '@features/teams/application/use-cases/list-teams/ListTeamsUseCase.js'
import type { ITeamRepository } from '@features/teams/domain/repositories/team/ITeamRepository.js'
import type { IMetricsService } from '@shared/monitoring/IMetricsService.js'
import { buildTeam } from '@shared/testing/index.js'
import type { PaginationQueryDTO } from '@team-pulse/shared'
import { Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ListTeamsUseCase', () => {
  let listTeamsUseCase: ListTeamsUseCase
  let teamRepository: ITeamRepository
  let metricsService: IMetricsService

  beforeEach(() => {
    vi.clearAllMocks()

    teamRepository = { findAllPaginated: vi.fn() } as unknown as ITeamRepository
    metricsService = { setTeamsTotal: vi.fn() } as unknown as IMetricsService

    listTeamsUseCase = ListTeamsUseCase.create({ metricsService, teamRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return paginated teams with default parameters', async () => {
        // Arrange
        // No params provided in DTO, should default to page 1, limit 10
        const dto = {} satisfies Partial<PaginationQueryDTO>
        const mockTeams = Array.from({ length: 5 }, () => buildTeam())
        const mockTotal = 20

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: mockTeams, total: mockTotal }))

        // Act
        const result = await listTeamsUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })

        expect(response.data).toHaveLength(5)
        expect(response.data[0]?.id).toBe(mockTeams[0]?.id)
        expect(response.meta).toEqual({
          hasNext: true,
          hasPrev: false,
          limit: 10,
          page: 1,
          total: mockTotal,
          totalPages: 2,
        })
      })

      it('should return paginated teams with custom parameters', async () => {
        // Arrange
        const dto = { limit: 50, page: 3 } satisfies PaginationQueryDTO
        const mockTeams = Array.from({ length: 10 }, () => buildTeam())
        const mockTotal = 150

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: mockTeams, total: mockTotal }))

        // Act
        const response = expectSuccess(await listTeamsUseCase.execute({ dto }))

        // Assert
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 50, page: 3 })

        expect(response.meta.page).toBe(3)
        expect(response.meta.limit).toBe(50)
        expect(response.meta.totalPages).toBe(3)
      })

      it('should handle empty result set', async () => {
        // Arrange
        const dto = { limit: 10, page: 1 } satisfies PaginationQueryDTO

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const response = expectSuccess(await listTeamsUseCase.execute({ dto }))

        // Assert
        expect(response.data).toEqual([])
        expect(response.meta.total).toBe(0)
        expect(response.meta.totalPages).toBe(1) // Minimum page is 1
      })

      it('should update metrics with total count', async () => {
        // Arrange
        const mockTotal = faker.number.int({ max: 1000, min: 100 })

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: mockTotal }))

        // Act
        await listTeamsUseCase.execute({ dto: {} })

        // Assert
        expect(metricsService.setTeamsTotal).toHaveBeenCalledWith({ count: mockTotal })
        expect(metricsService.setTeamsTotal).toHaveBeenCalledTimes(1)
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should sanitize invalid pagination parameters instead of failing', async () => {
        // Arrange
        const dto = { limit: 10, page: -5 } satisfies PaginationQueryDTO

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const response = expectSuccess(await listTeamsUseCase.execute({ dto }))

        // Assert
        expect(response.meta.page).toBe(1) // Should be sanitized to default
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when repository fails', async () => {
        // Arrange
        const dbError = RepositoryError.forOperation({ message: faker.lorem.sentence(), operation: 'findAllPaginated' })

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Err(dbError))

        // Act
        const result = await listTeamsUseCase.execute({ dto: {} })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(metricsService.setTeamsTotal).not.toHaveBeenCalled()
      })
    })
  })
})
