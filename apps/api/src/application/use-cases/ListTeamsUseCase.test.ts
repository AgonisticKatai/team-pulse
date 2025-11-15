import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Ok } from '../../domain/types/Result.js'
import { buildExistingTeam, buildTeam, buildTeamWithoutFoundedYear, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { ListTeamsUseCase } from './ListTeamsUseCase.js'

describe('ListTeamsUseCase', () => {
  let listTeamsUseCase: ListTeamsUseCase
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
    id: 'team-3',
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

    // Create use case instance
    listTeamsUseCase = ListTeamsUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful listing', () => {
      it('should return Ok with all teams when teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2, mockTeam3], total: 3 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        await listTeamsUseCase.execute()

        // Assert
        expect(teamRepository.findAllPaginated).toHaveBeenCalledTimes(1)
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ page: 1, limit: 10 })
      })

      it('should return teams with all properties in DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1], total: 1 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toEqual([])
        expect(result.pagination.total).toBe(0)
        expect(result.pagination.totalPages).toBe(0)
      })

      it('should return pagination metadata when no teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [], total: 0 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toHaveLength(1)
        expect(result.pagination.total).toBe(1)
        expect(result.teams[0]?.id).toBe(TEST_CONSTANTS.mockUuid)
      })
    })

    describe('multiple teams', () => {
      it('should maintain team order from repository', async () => {
        // Arrange
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: [mockTeam1, mockTeam2, mockTeam3], total: 3 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

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
            id: `team-${i}`,
            name: `Team ${i}`,
          }),
        )
        vi.mocked(teamRepository.findAllPaginated).mockResolvedValue(Ok({ teams: manyTeams, total: 50 }))

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

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
        const result = expectSuccess(await listTeamsUseCase.execute({ page: 2, limit: 5 }))

        // Assert
        expect(teamRepository.findAllPaginated).toHaveBeenCalledWith({ page: 2, limit: 5 })
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
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        result.teams.forEach((team) => {
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
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams[0]?.foundedYear).toBeNull()
        expect(result.teams[1]?.foundedYear).toBeNull()
      })
    })
  })
})
