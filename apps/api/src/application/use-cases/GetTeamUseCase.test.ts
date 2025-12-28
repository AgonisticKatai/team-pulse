import { GetTeamUseCase } from '@application/use-cases/GetTeamUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@shared/testing/index.js'
import { Err, NotFoundError, Ok, RepositoryError, TeamId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('GetTeamUseCase', () => {
  let getTeamUseCase: GetTeamUseCase
  let teamRepository: ITeamRepository

  beforeEach(() => {
    vi.clearAllMocks()

    teamRepository = { findById: vi.fn() } as unknown as ITeamRepository

    getTeamUseCase = GetTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return team DTO when team exists', async () => {
        // Arrange
        const team = buildTeam()

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))

        // Act
        const result = await getTeamUseCase.execute({ id: team.id })

        // Assert
        const dto = expectSuccess(result)

        expect(teamRepository.findById).toHaveBeenCalledWith({ id: team.id })

        expect(dto.id).toBe(team.id)
        expect(dto.name).toBe(team.name.getValue())
        expect(dto.createdAt).toBe(team.createdAt.toISOString())
        expect(dto.updatedAt).toBe(team.updatedAt.toISOString())
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        const nonExistentId = TeamId.random()

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await getTeamUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('Team')
        expect(error.metadata?.identifier).toBe(nonExistentId)
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when database fails', async () => {
        // Arrange
        const id = TeamId.random()
        const errorMessage = faker.lorem.sentence()

        vi.mocked(teamRepository.findById).mockResolvedValue(
          Err(RepositoryError.forOperation({ message: errorMessage, operation: 'findById' })),
        )

        // Act
        const result = await getTeamUseCase.execute({ id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe(errorMessage)
      })
    })
  })
})
