import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import {
  buildExistingTeam,
  buildTeam,
  buildTeamWithoutFoundedYear,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
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
      findById: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    listTeamsUseCase = new ListTeamsUseCase(teamRepository)
  })

  describe('execute', () => {
    describe('successful listing', () => {
      it('should return Ok with all teams when teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam2, mockTeam3])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toHaveLength(3)
        expect(result.total).toBe(3)
      })

      it('should call teamRepository.findAll', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam2])

        // Act
        await listTeamsUseCase.execute()

        // Assert
        expect(teamRepository.findAll).toHaveBeenCalledTimes(1)
      })

      it('should return teams with all properties in DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1])

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
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert - dates are ISO strings
        expect(result.teams[0]).toMatchObject({
          createdAt: TEST_CONSTANTS.MOCK_DATE_ISO,
          updatedAt: TEST_CONSTANTS.MOCK_DATE_ISO,
        })
      })

      it('should return correct total count', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam2])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.total).toBe(2)
        expect(result.teams.length).toBe(result.total)
      })

      it('should handle teams with and without founded year', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam3])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams[0]?.foundedYear).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.foundedYear)
        expect(result.teams[1]?.foundedYear).toBeNull()
      })
    })

    describe('empty results', () => {
      it('should return empty array when no teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toEqual([])
        expect(result.total).toBe(0)
      })

      it('should return total 0 when no teams exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.total).toBe(0)
      })
    })

    describe('single team', () => {
      it('should handle single team correctly', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toHaveLength(1)
        expect(result.total).toBe(1)
        expect(result.teams[0]?.id).toBe(TEST_CONSTANTS.MOCK_UUID)
      })
    })

    describe('multiple teams', () => {
      it('should maintain team order from repository', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam2, mockTeam3])

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams[0]?.name).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.name)
        expect(result.teams[1]?.name).toBe('Real Madrid')
        expect(result.teams[2]?.name).toBe('Athletic Bilbao')
      })

      it('should handle large number of teams', async () => {
        // Arrange
        const manyTeams = Array.from({ length: 50 }, (_, i) =>
          buildTeam({
            city: `City ${i}`,
            id: `team-${i}`,
            name: `Team ${i}`,
          }),
        )
        vi.mocked(teamRepository.findAll).mockResolvedValue(manyTeams)

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams).toHaveLength(50)
        expect(result.total).toBe(50)
      })
    })

    describe('edge cases', () => {
      it('should convert all teams to DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findAll).mockResolvedValue([mockTeam1, mockTeam2])

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
        vi.mocked(teamRepository.findAll).mockResolvedValue(teamsWithNullYear)

        // Act
        const result = expectSuccess(await listTeamsUseCase.execute())

        // Assert
        expect(result.teams[0]?.foundedYear).toBeNull()
        expect(result.teams[1]?.foundedYear).toBeNull()
      })
    })
  })
})
