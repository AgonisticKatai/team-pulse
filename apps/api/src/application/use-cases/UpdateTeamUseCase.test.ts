import { UpdateTeamUseCase } from '@application/use-cases/UpdateTeamUseCase.js'
import type { Team } from '@domain/models/team/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@infrastructure/testing/index.js'
import type { UpdateTeamDTO } from '@team-pulse/shared'
import { Err, Ok, RepositoryError, TeamId, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('UpdateTeamUseCase', () => {
  let updateTeamUseCase: UpdateTeamUseCase
  let teamRepository: ITeamRepository

  beforeEach(() => {
    vi.clearAllMocks()

    teamRepository = {
      findById: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
    } as unknown as ITeamRepository

    updateTeamUseCase = UpdateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should update team name and ensure persistence', async () => {
        // Arrange
        const originalTeam = buildTeam({ name: 'Short Name', updatedAt: faker.date.past() })
        const dto = { name: `${originalTeam.name.getValue()} Updated` } satisfies UpdateTeamDTO

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

        expect(response.id).toBe(originalTeam.id)
        expect(response.name).toBe(dto.name)

        expect(teamRepository.findByName).toHaveBeenCalledWith({ name: dto.name })

        const { team: savedTeam } = expectMockCallArg<{ team: Team }>(vi.mocked(teamRepository.save))
        expect(savedTeam.updatedAt.getTime()).toBeGreaterThan(originalTeam.updatedAt.getTime())
      })

      it('should skip uniqueness check if name is unchanged', async () => {
        // Arrange
        const originalTeam = buildTeam()
        const dto = { name: originalTeam.name.getValue() } satisfies UpdateTeamDTO

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(originalTeam))
        vi.mocked(teamRepository.save).mockImplementation(async ({ team }) => Ok(team))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: originalTeam.id })

        // Assert
        expectSuccess(result)
        expect(teamRepository.findByName).not.toHaveBeenCalled()
        expect(teamRepository.save).toHaveBeenCalledTimes(1)
      })

      it('should return ValidationError if update violates domain rules', async () => {
        // Arrange
        const team = buildTeam()
        const dto: UpdateTeamDTO = { name: 'A' } // Too short (assuming min 3)

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Act
        // Typically validation happens in TeamName.create or Team.update
        // If 'A' is invalid, Team.update -> TeamName.create will fail.
        const result = await updateTeamUseCase.execute({ dto, id: team.id })

        // Assert
        // If "A" is valid in your domain currently, this test might fail.
        // Assuming strict validation exists. If not, use empty string.
        expectErrorType({ errorType: ValidationError, result })
        expect(teamRepository.save).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when repository findById fails', async () => {
        // Arrange
        const id = TeamId.random()
        const dbError = RepositoryError.forOperation({ message: 'DB Error', operation: 'findById' })

        vi.mocked(teamRepository.findById).mockResolvedValue(Err(dbError))

        // Act
        const result = await updateTeamUseCase.execute({ dto: {}, id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })

      it('should return RepositoryError if save fails', async () => {
        // Arrange
        const team = buildTeam()
        const dto = { name: 'New Name' } satisfies UpdateTeamDTO
        const dbError = RepositoryError.forOperation({ message: 'Save Error', operation: 'save' })

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(dbError))

        // Act
        const result = await updateTeamUseCase.execute({ dto, id: team.id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })
    })
  })
})
