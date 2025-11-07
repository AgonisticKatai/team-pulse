import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RepositoryError, ValidationError } from '../../domain/errors/index.js'
import { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok } from '../../domain/types/index.js'
import {
  buildCreateTeamDTO,
  buildExistingTeam,
  buildTeam,
  buildTeamWithoutFoundedYear,
  expectError,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { CreateTeamUseCase } from './CreateTeamUseCase.js'

// Mock external dependencies
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.MOCK_UUID),
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
        expect(team.id).toBe(TEST_CONSTANTS.MOCK_UUID)
        expect(team.name).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.name)
        expect(team.city).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.city)
        expect(team.foundedYear).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.foundedYear)
      })

      it('should check if team name already exists', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(teamRepository.findByName).toHaveBeenCalledWith(
          TEST_CONSTANTS.TEAMS.FC_BARCELONA.name,
        )
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
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam).toBeInstanceOf(Team)
        expect(savedTeam.id.getValue()).toBe(TEST_CONSTANTS.MOCK_UUID)
        expect(savedTeam.name.getValue()).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.name)
        expect(savedTeam.city.getValue()).toBe(TEST_CONSTANTS.TEAMS.FC_BARCELONA.city)
        expect(savedTeam.foundedYear?.getValue()).toBe(
          TEST_CONSTANTS.TEAMS.FC_BARCELONA.foundedYear,
        )
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
        expect(team.createdAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
        expect(team.updatedAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
      })

      it('should handle team without foundedYear', async () => {
        // Arrange
        const teamWithoutYear = buildTeamWithoutFoundedYear({
          city: TEST_CONSTANTS.TEAMS.VALENCIA_CF.city,
          name: TEST_CONSTANTS.TEAMS.VALENCIA_CF.name,
        })

        const dto = buildCreateTeamDTO({
          city: TEST_CONSTANTS.TEAMS.VALENCIA_CF.city,
          foundedYear: undefined,
          name: TEST_CONSTANTS.TEAMS.VALENCIA_CF.name,
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
        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toBe(
          `A team with name "${TEST_CONSTANTS.TEAMS.FC_BARCELONA.name}" already exists`,
        )
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
          foundedYear: TEST_CONSTANTS.INVALID.FOUNDED_YEAR_TOO_OLD,
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
          message: TEST_CONSTANTS.ERRORS.DATABASE_CONNECTION_LOST,
          operation: 'save',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.ERRORS.DATABASE_CONNECTION_LOST)
      })

      it('should return Err when repository findByName fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.ERRORS.DATABASE_QUERY_TIMEOUT,
          operation: 'findByName',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createTeamUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.ERRORS.DATABASE_QUERY_TIMEOUT)
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
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam.id.getValue()).toBe(TEST_CONSTANTS.MOCK_UUID)
      })

      it('should handle null foundedYear from DTO', async () => {
        // Arrange
        const teamWithoutYear = buildTeamWithoutFoundedYear({
          city: TEST_CONSTANTS.TEAMS.SEVILLA_FC.city,
          name: TEST_CONSTANTS.TEAMS.SEVILLA_FC.name,
        })

        const dto = buildCreateTeamDTO({
          city: TEST_CONSTANTS.TEAMS.SEVILLA_FC.city,
          foundedYear: null,
          name: TEST_CONSTANTS.TEAMS.SEVILLA_FC.name,
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(teamWithoutYear))

        // Act
        expectSuccess(await createTeamUseCase.execute(dto))

        // Assert
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam.foundedYear).toBeNull()
      })
    })
  })
})
