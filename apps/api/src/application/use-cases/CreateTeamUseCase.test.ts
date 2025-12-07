import { CreateTeamUseCase } from '@application/use-cases/CreateTeamUseCase.js'
import { Team } from '@domain/models/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildCreateTeamDTO, buildTeam } from '@infrastructure/testing/index.js'
import { IdUtils } from '@team-pulse/shared/domain/ids'
import { ConflictError, RepositoryError, ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok } from '@team-pulse/shared/result'
import { expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing/helpers'
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
    describe('successful team creation', () => {
      it('should return Ok with team data when creation succeeds', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Echo Mock: The mock returns exactly what it receives (the entity intended to be saved).
        // This ensures the input-output flow is consistent regardless of the random data generated.
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await createTeamUseCase.execute({ dto })
        const response = expectSuccess(result)

        // Assert
        expect(response.id).toBeDefined()
        expect(response.name).toBe(dto.name)
        expect(response.city).toBe(dto.city)
        expect(response.foundedYear).toBe(dto.foundedYear)
      })

      it('should check if team name already exists', async () => {
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        await createTeamUseCase.execute({ dto })

        expect(teamRepository.findByName).toHaveBeenCalledWith({ name: dto.name })
        expect(teamRepository.findByName).toHaveBeenCalledTimes(1)
      })

      it('should save team with generated UUID', async () => {
        const dto = buildCreateTeamDTO()

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        await createTeamUseCase.execute({ dto })

        expect(teamRepository.save).toHaveBeenCalledTimes(1)

        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))

        expect(savedTeam).toBeInstanceOf(Team)

        expect(IdUtils.isValid(savedTeam.id)).toBe(true)

        expect(savedTeam.name.getValue()).toBe(dto.name)
        expect(savedTeam.city.getValue()).toBe(dto.city)
        expect(savedTeam.foundedYear?.getValue()).toBe(dto.foundedYear)
      })

      it('should handle team without foundedYear (null)', async () => {
        // Arrange
        const dto = buildCreateTeamDTO({ foundedYear: null })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const response = expectSuccess(await createTeamUseCase.execute({ dto }))

        // Assert
        expect(response.foundedYear).toBeNull()

        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))
        expect(savedTeam.foundedYear).toBeNull()
      })

      it('should handle team with undefined foundedYear (optional in DTO)', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()
        // Dynamically exclude the property to simulate 'undefined' (missing field in JSON)
        const { foundedYear, ...restDto } = dto

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const response = expectSuccess(await createTeamUseCase.execute({ dto: restDto }))

        // Assert
        // Sanity check
        expect(foundedYear).toBeDefined()
        // The domain logic converts undefined input to null foundedYear
        expect(response.foundedYear).toBeNull()
      })
    })

    describe('error cases', () => {
      it('should return Err when team name already exists', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        // 🔥 EXPLICIT USE: Force collision using the dynamic DTO name.
        // It doesn't matter what random name faker generated, we create an existing team with the SAME name.
        const existingTeam = buildTeam({ name: dto.name })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam))

        // Act
        const error = expectErrorType({ errorType: ConflictError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toContain('already exists')
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return ValidationError when team data is invalid (too old)', async () => {
        // Arrange
        // 🔥 EXPLICIT USE: Generate a dynamic invalid year (any between 0 and 1799).
        // We test the invalid RANGE, not just a hardcoded number like '1700'.
        const invalidYear = faker.number.int({ max: 1799, min: 0 })

        const dto = buildCreateTeamDTO({ foundedYear: invalidYear })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Act
        // The use case calls Team.create, which returns ValidationError for invalid VOs
        expectErrorType({ errorType: ValidationError, result: await createTeamUseCase.execute({ dto }) })

        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return Err when repository save fails', async () => {
        // Arrange
        const dto = buildCreateTeamDTO()

        // 🔥 EXPLICIT USE: The error message is also dynamic.
        // Ensures the use case propagates the EXACT error it receives.
        const randomErrorMessage = faker.lorem.sentence()

        const repositoryError = RepositoryError.forOperation({ message: randomErrorMessage, operation: 'save' })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectErrorType({ errorType: RepositoryError, result: await createTeamUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toBe(randomErrorMessage)
      })

      it('should return Err when repository findByName fails', async () => {
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
