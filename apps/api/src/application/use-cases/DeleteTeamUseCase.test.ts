import { DeleteTeamUseCase } from '@application/use-cases/DeleteTeamUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@shared/testing/index.js'
import { Err, NotFoundError, Ok, RepositoryError, TeamId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('DeleteTeamUseCase', () => {
  let deleteTeamUseCase: DeleteTeamUseCase
  let teamRepository: ITeamRepository

  beforeEach(() => {
    vi.clearAllMocks()

    teamRepository = { delete: vi.fn(), findById: vi.fn() } as unknown as ITeamRepository

    deleteTeamUseCase = DeleteTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should delete an existing team', async () => {
        // Arrange
        const team = buildTeam()

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        const result = await deleteTeamUseCase.execute({ id: team.id })

        // Assert
        expectSuccess(result)
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: team.id })
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: team.id })
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
        const result = await deleteTeamUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('Team')
        expect(error.metadata?.identifier).toBe(nonExistentId)
        expect(teamRepository.delete).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when finding team fails', async () => {
        // Arrange
        const id = TeamId.random()
        const dbError = RepositoryError.forOperation({
          message: faker.lorem.sentence(),
          operation: 'findById',
        })

        vi.mocked(teamRepository.findById).mockResolvedValue(Err(dbError))

        // Act
        const result = await deleteTeamUseCase.execute({ id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(teamRepository.delete).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when deletion fails', async () => {
        // Arrange
        const team = buildTeam()
        const dbError = RepositoryError.forOperation({
          message: faker.lorem.sentence(),
          operation: 'delete',
        })

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        vi.mocked(teamRepository.delete).mockResolvedValue(Err(dbError))

        // Act
        const result = await deleteTeamUseCase.execute({ id: team.id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: team.id })
      })
    })
  })
})
