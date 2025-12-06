import { ListTeamsUseCase } from '@application/use-cases/ListTeamsUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import { buildExistingTeam, buildTeam, buildTeamWithoutFoundedYear } from '@infrastructure/testing/index.js'
import { Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ListTeamsUseCase', () => {
  let listTeamsUseCase: ListTeamsUseCase
  let metricsService: IMetricsService
  let teamRepository: ITeamRepository

  // Mock team data
  const mockTeam1 = buildTeam()
  const mockTeam2 = buildExistingTeam({
    city: 'Madrid',
    foundedYear: 1902,
    name: 'Real Madrid',
  })
  const mockTeam3 = buildTeamWithoutFoundedYear({
    city: 'Bilbao',
    id: '550e8400-e29b-41d4-a716-446655510003',
    name: 'Athletic Bilbao',
  })

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock repository
    teamRepository = {
      delete: vi.fn(),
      existsByName: vi.fn(),
      findAll: vi.fn(),
      findAllPaginated: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
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
    listTeamsUseCase = ListTeamsUseCase.create({ metricsService, teamRepository })
  })

  describe('execute', () => {
    describe('successful listing', () => {
      it('should return Ok with all teams when teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2, mockTeam3], total: 3 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams).toHaveLength(3)
        expect(result.pagination.total).toBe(3)
        expect(result.pagination.page).toBe(1)
        expect(result.pagination.limit).toBe(10)
        expect(result.pagination.totalPages).toBe(1)
      })

      it('should call teamRepository.findAllPaginated with default pagination', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2], total: 2 }))

        // Act
        await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } })

        // Assert
        expect(teamRepository.findAllPaginated).toHaveBeenCalledTimes(1)
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 10, page: 1 })
      })

      it('should return teams with all properties in DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1], total: 1 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert - verify structure
        expect(result.teams).toHaveLength(1)
        expect(result.teams[0]).toMatchObject({
          city: expect.any(String),
          createdAt: expect.any(String),
          id: expect.any(String),
          name: expect.any(String),
          updatedAt: expect.any(String),
        })
      })

      it('should return dates as ISO strings in DTOs', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1], total: 1 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert - dates are ISO strings
        expect(result.teams[0]).toMatchObject({
          createdAt: TEST_CONSTANTS.mockDateIso,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should return correct pagination metadata', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2], total: 2 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.pagination.total).toBe(2)
        expect(result.teams.length).toBe(2)
        expect(result.pagination.page).toBe(1)
        expect(result.pagination.limit).toBe(10)
        expect(result.pagination.totalPages).toBe(1)
      })

      it('should handle teams with and without founded year', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam3], total: 2 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams[0]?.foundedYear).toBe(TEST_CONSTANTS.teams.fcBarcelona.foundedYear)
        expect(result.teams[1]?.foundedYear).toBeNull()
      })
    })

    describe('empty results', () => {
      it('should return empty array when no teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams).toEqual([])
        expect(result.pagination.total).toBe(0)
        expect(result.pagination.totalPages).toBe(0)
      })

      it('should return pagination metadata when no teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.pagination.total).toBe(0)
        expect(result.pagination.page).toBe(1)
        expect(result.pagination.limit).toBe(10)
        expect(result.pagination.totalPages).toBe(0)
      })
    })

    describe('single team', () => {
      it('should handle single team correctly', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1], total: 1 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams).toHaveLength(1)
        expect(result.pagination.total).toBe(1)
        expect(result.teams[0]?.id).toBe(mockTeam1.id.getValue())
      })
    })

    describe('multiple teams', () => {
      it('should maintain team order from repository', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2, mockTeam3], total: 3 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams[0]?.name).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
        expect(result.teams[1]?.name).toBe('Real Madrid')
        expect(result.teams[2]?.name).toBe('Athletic Bilbao')
      })

      it('should calculate correct totalPages for large datasets', async () => {
        // Arrange - 50 teams with limit 10 = 5 pages
        const manyTeams = Array.from({ length: 10 }, (_, i) =>
          buildTeam({
            city: `City ${i}`,
            id: `550e8400-e29b-41d4-a716-4466555200${i.toString().padStart(2, '0')}`,
            name: `Team ${i}`,
          }),
        )
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: manyTeams, total: 50 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams).toHaveLength(10)
        expect(result.pagination.total).toBe(50)
        expect(result.pagination.totalPages).toBe(5)
      })
    })

    describe('pagination', () => {
      it('should respect custom page and limit parameters', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2], total: 20 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 5, page: 2 } }))

        // Assert
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ limit: 5, page: 2 })
        expect(result.pagination.page).toBe(2)
        expect(result.pagination.limit).toBe(5)
        expect(result.pagination.total).toBe(20)
        expect(result.pagination.totalPages).toBe(4)
      })
    })

    describe('edge cases', () => {
      it('should convert all teams to DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2], total: 2 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        result.teams.forEach((team: (typeof result.teams)[number]) => {
          expect(typeof team.id).toBe('string')
          expect(typeof team.name).toBe('string')
          expect(typeof team.city).toBe('string')
          expect(typeof team.createdAt).toBe('string')
          expect(typeof team.updatedAt).toBe('string')
        })
      })

      it('should handle teams with null founded year', async () => {
        // Arrange
        const teamsWithNullYear = [buildTeamWithoutFoundedYear(), buildTeamWithoutFoundedYear()]
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: teamsWithNullYear, total: 2 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute({ dto: { limit: 10, page: 1 } }))

        // Assert
        expect(result.teams[0]?.foundedYear).toBeNull()
        expect(result.teams[1]?.foundedYear).toBeNull()
      })
    })
  })
})
