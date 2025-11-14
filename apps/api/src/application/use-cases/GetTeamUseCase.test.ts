import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Ok } from '../../domain/types/Result.js'
import { buildTeam, expectError, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { GetTeamUseCase } from './GetTeamUseCase.js'

describe('GetTeamUseCase', () => {
  let getTeamUseCase: GetTeamUseCase
  let teamRepository: ITeamRepository

  // Mock team data
  const mockTeam = buildTeam()

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
    getTeamUseCase = GetTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful retrieval', () => {
      it('should return Ok with team data when team exists', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(team.id).toBe(TEST_CONSTANTS.mockUuid)
        expect(team.name).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
        expect(team.city).toBe(TEST_CONSTANTS.teams.fcBarcelona.city)
        expect(team.foundedYear).toBe(TEST_CONSTANTS.teams.fcBarcelona.foundedYear)
      })

      it('should call teamRepository.findById with correct id', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid)

        // Assert
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: TEST_CONSTANTS.mockUuid })
        expect(teamRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should return team with all properties in DTO format', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(team).toHaveProperty('id')
        expect(team).toHaveProperty('name')
        expect(team).toHaveProperty('city')
        expect(team).toHaveProperty('foundedYear')
        expect(team).toHaveProperty('createdAt')
        expect(team).toHaveProperty('updatedAt')
      })

      it('should return dates as ISO strings in DTO', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(typeof team.createdAt).toBe('string')
        expect(typeof team.updatedAt).toBe('string')
        expect(team.createdAt).toBe(TEST_CONSTANTS.mockDateIso)
        expect(team.updatedAt).toBe(TEST_CONSTANTS.mockDateIso)
      })
    })

    describe('not found errors', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toContain('Team')
        expect(error.message).toContain(TEST_CONSTANTS.mockUuid)
      })

      it('should return NotFoundError for non-existent id', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id'
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await getTeamUseCase.execute(nonExistentId))

        // Assert
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toContain(nonExistentId)
      })
    })

    describe('edge cases', () => {
      it('should handle team without founded year', async () => {
        // Arrange
        const teamWithoutYear = buildTeam({ foundedYear: null })
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(teamWithoutYear))

        // Act
        const team = expectSuccess(await getTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(team.foundedYear).toBeNull()
      })

      it('should handle different team ids', async () => {
        // Arrange
        const differentId = 'different-id'
        const differentTeam = buildTeam({ id: differentId })
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(differentTeam))

        // Act
        const team = expectSuccess(await getTeamUseCase.execute(differentId))

        // Assert
        expect(team.id).toBe(differentId)
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: differentId })
      })
    })
  })
})
