import { Err, Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { buildCreateTeamDTO } from '@team-pulse/shared/testing/dto-builders'
import { expectError, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DuplicatedError, RepositoryError, ValidationError } from '../../domain/errors/index.js'
import { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { buildExistingTeam, buildTeam, buildTeamWithoutFoundedYear } from '../../infrastructure/testing/index.js'
import { CreateTeamUseCase } from './CreateTeamUseCase.js'

// Mock external dependencies
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.mockUuid),
}))

describe('CreateTeamUseCase', () => {
  let createTeamUseCase: CreateTeamUseCase
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
      findAllPaginated: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    createTeamUseCase = CreateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful team creation', () => {
      it('should return Ok with team data when creation succeeds', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await createTeamUseCase.execute(dto))

        // Assert
        expect(team.id).toBe(TEST_CONSTANTS.mockUuid)
        expect(team.name).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
        expect(team.city).toBe(TEST_CONSTANTS.teams.fcBarcelona.city)
        expect(team.foundedYear).toBe(TEST_CONSTANTS.teams.fcBarcelona.foundedYear)
      })

      it('should check if team name already exists', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(teamRepository.findByName).toHaveBeenCalledWith({
          name: TEST_CONSTANTS.teams.fcBarcelona.name,
        })
        expect(teamRepository.findByName).toHaveBeenCalledTimes(1)
      })

      it('should save team with generated UUID', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(teamRepository.save).toHaveBeenCalledTimes(1)

        // Verify the saved team entity
        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))

        expect(savedTeam).toBeInstanceOf(Team)
        expect(savedTeam.id.getValue()).toBe(TEST_CONSTANTS.mockUuid)
        expect(savedTeam.name.getValue()).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
        expect(savedTeam.city.getValue()).toBe(TEST_CONSTANTS.teams.fcBarcelona.city)
        expect(savedTeam.foundedYear?.getValue()).toBe(TEST_CONSTANTS.teams.fcBarcelona.foundedYear)
      })

      it('should return team DTO with ISO date strings', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await createTeamUseCase.execute(dto))

        // Assert
        expect(typeof team.createdAt).toBe('string')
        expect(typeof team.updatedAt).toBe('string')
        expect(team.createdAt).toBe(TEST_CONSTANTS.mockDateIso)
        expect(team.updatedAt).toBe(TEST_CONSTANTS.mockDateIso)
      })

      it('should handle team without foundedYear', async () => {
        // Arrange
        const teamWithoutYear = buildTeamWithoutFoundedYear({
          city: TEST_CONSTANTS.teams.valenciaCf.city,
          name: TEST_CONSTANTS.teams.valenciaCf.name,
        })

        const dto = buildCreateTeamDTO({
          city: TEST_CONSTANTS.teams.valenciaCf.city,
          foundedYear: undefined,
          name: TEST_CONSTANTS.teams.valenciaCf.name,
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(teamWithoutYear))

        // Act
        const team = expectSuccess(await createTeamUseCase.execute(dto))

        // Assert
        expect(team.foundedYear).toBeNull()
      })
    })

    describe('error cases', () => {
      it('should return Err when team name already exists', async () => {
        // Arrange
        const existingTeam = buildExistingTeam()
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(DuplicatedError)
        expect(error.message).toContain('already exists')
        expect(error.message).toContain(TEST_CONSTANTS.teams.fcBarcelona.name)
      })

      it('should not save team when name already exists', async () => {
        // Arrange
        const existingTeam = buildExistingTeam()
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert - Should fail before saving
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return Err when team data is invalid', async () => {
        // Arrange - Invalid foundedYear (too old)
        const dto = buildCreateTeamDTO({
          foundedYear: TEST_CONSTANTS.invalid.foundedYearTooOld,
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
      })

      it('should return Err when repository save fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'save',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
      })

      it('should return Err when repository findByName fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseQueryTimeout,
          operation: 'findByName',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.errors.databaseQueryTimeout)
      })
    })

    describe('edge cases', () => {
      it('should generate UUID for new team', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        const { randomUUID } = await import('node:crypto')

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(randomUUID).toHaveBeenCalled()

        // Verify the saved team entity
        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))

        expect(savedTeam.id.getValue()).toBe(TEST_CONSTANTS.mockUuid)
      })

      it('should handle null foundedYear from DTO', async () => {
        // Arrange
        const teamWithoutYear = buildTeamWithoutFoundedYear({
          city: TEST_CONSTANTS.teams.sevillaFc.city,
          name: TEST_CONSTANTS.teams.sevillaFc.name,
        })

        const dto = buildCreateTeamDTO({
          city: TEST_CONSTANTS.teams.sevillaFc.city,
          foundedYear: null,
          name: TEST_CONSTANTS.teams.sevillaFc.name,
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(teamWithoutYear))

        // Act
        expectSuccess(await createTeamUseCase.execute(dto))

        // Assert
        // Verify the saved team entity
        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))

        expect(savedTeam.foundedYear).toBeNull()
      })
    })
  })
})
