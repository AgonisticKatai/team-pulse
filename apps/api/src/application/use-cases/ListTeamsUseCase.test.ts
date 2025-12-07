import { ListTeamsUseCase } from '@application/use-cases/ListTeamsUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@infrastructure/testing/index.js'
import type { PaginationQuery } from '@team-pulse/shared/dtos'
import { RepositoryError, ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok } from '@team-pulse/shared/result'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
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
    describe('successful retrieval', () => {
      it('should return paginated teams with default parameters', async () => {
        // Arrange
        // No params provided in DTO, should default to page 1, limit 10
        const dto: PaginationQuery = {}

        // Generate random teams
        const mockTeams = Array.from({ length: 5 }, () => buildTeam())
        const mockTotal = 20 // Total in DB

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: mockTeams, total: mockTotal }))

        // Act
        const result = await listTeamsUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        // 1. Verify Repository Call (Defaults)
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })

        // 2. Verify DTO Mapping
        expect(response.teams).toHaveLength(5)
        expect(response.teams[0]?.id).toBe(mockTeams[0]?.id)

        // 3. Verify Pagination Metadata (Calculated by Domain VO)
        expect(response.pagination).toEqual({ limit: 10, page: 1, total: mockTotal, totalPages: 2 })
      })

      it('should return paginated teams with custom parameters', async () => {
        // Arrange
        const dto: PaginationQuery = { limit: 50, page: 3 }

        const mockTeams = Array.from({ length: 10 }, () => buildTeam())
        const mockTotal = 150

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: mockTeams, total: mockTotal }))

        // Act
        const response = expectSuccess(await listTeamsUseCase.execute({ dto }))

        // Assert
        // Verify custom params were passed to repo
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 50, page: 3 })

        expect(response.pagination.page).toBe(3)
        expect(response.pagination.limit).toBe(50)
        expect(response.pagination.totalPages).toBe(3) // 150 / 50 = 3
      })

      it('should handle empty result set', async () => {
        // Arrange
        const dto: PaginationQuery = { limit: 10, page: 1 }

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const response = expectSuccess(await listTeamsUseCase.execute({ dto }))

        // Assert
        expect(response.teams).toEqual([])
        expect(response.pagination.total).toBe(0)
        expect(response.pagination.totalPages).toBe(0) // Or 1, depending on your VO logic
      })

      it('should update metrics with total count', async () => {
        // Arrange
        const mockTotal = faker.number.int({ max: 1000, min: 100 })

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: mockTotal }))

        // Act
        await listTeamsUseCase.execute({ dto: {} })

        // Assert
        // Verify side effect
        expect(metricsService.setTeamsTotal).toHaveBeenCalledWith({ count: mockTotal })
        expect(metricsService.setTeamsTotal).toHaveBeenCalledTimes(1)
      })
    })

    describe('error cases', () => {
      it('should return RepositoryError when repository fails', async () => {
        // Arrange
        const dbError = RepositoryError.forOperation({ message: faker.lorem.sentence(), operation: 'findAllPaginated' })

        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Err(dbError))

        // Act
        const result = await listTeamsUseCase.execute({ dto: {} })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)

        // Metrics should NOT be updated on error
        expect(metricsService.setTeamsTotal).not.toHaveBeenCalled()
      })

      it('should return ValidationError if Pagination Value Object creation fails', async () => {
        // Arrange
        // We force invalid inputs via DTO that might bypass repo check
        // but fail domain validation (e.g., negative page)
        const dto: PaginationQuery = { limit: 10, page: -5 }

        // Even if repo ignores it or handles it, we assume it returns something
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const result = await listTeamsUseCase.execute({ dto })

        // Assert
        // The Use Case calls Pagination.create({ page: -5 ... }) which should fail
        expectErrorType({ errorType: ValidationError, result })
      })
    })
  })
})
