import { UpdateTeamUseCase } from '@application/use-cases/UpdateTeamUseCase.js'
import type { Team } from '@domain/models/team/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildCreateTeamDTO, buildTeam } from '@infrastructure/testing/index.js'
import type { UpdateTeamDTO } from '@team-pulse/shared'
import {
  ConflictError,
  Err,
  IdUtils,
  NotFoundError,
  Ok,
  RepositoryError,
  type TeamId,
  ValidationError,
} from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('UpdateTeamUseCase', () => {
  let updateTeamUseCase: UpdateTeamUseCase
  let teamRepository: ITeamRepository

  beforeEach(() => {
    vi.clearAllMocks()

    teamRepository = { findById: vi.fn(), findByName: vi.fn(), save: vi.fn() } as unknown as ITeamRepository

    updateTeamUseCase = UpdateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful updates', () => {
      it('should update team fields successfully', async () => {
        // Arrange
        const originalTeam = buildTeam({ updatedAt: faker.date.past() })
        const dto = buildCreateTeamDTO()

        // 1. Found existing
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(originalTeam))
        // 2. Name check: Not taken
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        // 3. Save: Echo mock (returns the updated entity passed to it)
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: originalTeam.id })

        // Assert
        const response = expectSuccess(result)

        // Check response DTO
        expect(response.id).toBe(originalTeam.id)
        expect(response.name).toBe(dto.name)
        expect(response.city).toBe(dto.city)
        expect(response.foundedYear).toBe(dto.foundedYear)

        // Verify repository interactions
        expect(teamRepository.findByName).toHaveBeenCalledWith({ name: dto.name })

        // Verify what was actually saved
        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))
        expect(savedTeam.updatedAt.getTime()).toBeGreaterThan(originalTeam.updatedAt.getTime())
      })

      it('should NOT check for uniqueness if name is unchanged', async () => {
        // Arrange
        const originalTeam = buildTeam()

        const dto: UpdateTeamDTO = { city: faker.location.city(), name: originalTeam.name.getValue() }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(originalTeam))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        await updateTeamUseCase.execute({ dto, id: originalTeam.id })

        // Assert
        // CRITICAL: Should skip the DB query for name
        expect(teamRepository.findByName).not.toHaveBeenCalled()
        expect(teamRepository.save).toHaveBeenCalledTimes(1)
      })

      it('should allow partial updates (only updating provided fields)', async () => {
        // Arrange
        const originalTeam = buildTeam()
        const updatedCity = `${originalTeam.city.getValue()}_Changed`
        const dto: UpdateTeamDTO = { city: updatedCity }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(originalTeam))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: originalTeam.id })

        // Assert
        const response = expectSuccess(result)
        expect(response.city).toBe(updatedCity)
        expect(response.name).toBe(originalTeam.name.getValue()) // Preserved

        expect(teamRepository.save).toHaveBeenCalled()
      })
    })

    describe('error cases', () => {
      it('should return NotFoundError if team does not exist', async () => {
        // Arrange
        const id = IdUtils.generate<TeamId>()
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await updateTeamUseCase.execute({ dto: {}, id })

        // Assert
        expectErrorType({ errorType: NotFoundError, result })
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return ConflictError if new name is taken by ANOTHER team', async () => {
        // Arrange
        const teamToUpdate = buildTeam()
        const otherTeam = buildTeam() // Different ID
        const dto: UpdateTeamDTO = { name: otherTeam.name.getValue() }

        // 1. Find target team
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(teamToUpdate))
        // 2. Find name collision -> Returns the OTHER team
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(otherTeam))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: teamToUpdate.id })

        // Assert
        const error = expectErrorType({ errorType: ConflictError, result })
        expect(error.message).toContain('already exists')
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should NOT return ConflictError if name is "taken" by SELF (idempotent)', async () => {
        // Edge case: Sometimes the name check might run even if names match (if logic changes),
        // or if findByName returns the same team.
        // The use case logic: if (findTeamResult.value && findTeamResult.value.id !== id)

        // Arrange
        const team = buildTeam()
        const updatedName = `${team.name.getValue()}_Changed`
        const dto: UpdateTeamDTO = { name: updatedName } // Let's say we force a check

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        // Mock findByName returning the SAME team (e.g. race condition or logic flaw)
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: team.id })

        // Assert
        expectSuccess(result) // Should succeed because ID matches
      })

      it('should return ValidationError if update violates domain rules', async () => {
        // Arrange
        const team = buildTeam()
        const invalidDto: UpdateTeamDTO = { foundedYear: 1700 } // Too old

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))

        // Act
        const result = await updateTeamUseCase.execute({ dto: invalidDto, id: team.id })

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError if save fails', async () => {
        // Arrange
        const team = buildTeam()
        const dto: UpdateTeamDTO = { city: `${team.city.getValue()}_Changed` }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.save).mockResolvedValue(
          Err(RepositoryError.forOperation({ message: 'DB Error', operation: 'save' })),
        )

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: team.id })

        // Assert
        expectErrorType({ errorType: RepositoryError, result })
      })
    })
  })
})
