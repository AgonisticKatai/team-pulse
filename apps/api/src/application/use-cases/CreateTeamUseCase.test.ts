import { CreateTeamUseCase } from '@application/use-cases/CreateTeamUseCase.js'
import { Team } from '@domain/models/team/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildCreateTeamDTO, buildTeam } from '@infrastructure/testing/index.js'
import { ConflictError, Err, IdUtils, Ok, RepositoryError, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateTeamUseCase', () => {
  let createTeamUseCase: CreateTeamUseCase
  let teamRepository: ITeamRepository

  beforeEach(() => {
    vi.clearAllMocks()
    teamRepository = { findAllPaginated: vi.fn(), findByName: vi.fn(), save: vi.fn() } as unknown as ITeamRepository
    createTeamUseCase = CreateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return Ok with team data when creation succeeds', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await createTeamUseCase.execute({ dto })
        const response = expectSuccess(result)

        // Assert
        expect(response.id).toBeDefined()
        expect(response.name).toBe(dto.name)
      })

      it('should save team with generated UUID and correct properties', async () => {
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        await createTeamUseCase.execute({ dto })

        expect(teamRepository.save).toHaveBeenCalledTimes(1)

        // Check what was passed to the repository
        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))

        expect(savedTeam).toBeInstanceOf(Team)
        expect(IdUtils.isValid(savedTeam.id)).toBe(true)
        expect(savedTeam.name.getValue()).toBe(dto.name)
      })

      it('should check if team name already exists before creating', async () => {
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        await createTeamUseCase.execute({ dto })

        expect(teamRepository.findByName).toHaveBeenCalledWith({ name: dto.name })
        expect(teamRepository.findByName).toHaveBeenCalledTimes(1)
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should return ValidationError when team name is invalid (too short)', async () => {
        // Arrange
        // Generate a DTO with a name that violates the Schema rules (e.g: "a")
        const dto = buildCreateTeamDTO({ name: 'a' })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Act
        // The error is thrown in Team.create() before calling the repository
        expectErrorType({ errorType: ValidationError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(teamRepository.save).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return ConflictError when team name already exists', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()
        const existingTeam = buildTeam({ name: dto.name })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam))

        // Act
        const error = expectErrorType({ errorType: ConflictError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toContain('already exists')
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when repository save fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()
        const randomErrorMessage = faker.lorem.sentence()
        const repositoryError = RepositoryError.forOperation({ message: randomErrorMessage, operation: 'save' })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectErrorType({ errorType: RepositoryError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toBe(randomErrorMessage)
      })

      it('should return RepositoryError when repository findByName fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()
        const randomErrorMessage = faker.lorem.sentence()
        const repositoryError = RepositoryError.forOperation({ message: randomErrorMessage, operation: 'findByName' })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectErrorType({ errorType: RepositoryError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toBe(randomErrorMessage)
      })
    })
  })
})
