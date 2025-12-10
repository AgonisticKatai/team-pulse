import { DeleteTeamUseCase } from '@application/use-cases/DeleteTeamUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@infrastructure/testing/index.js'
import { Err, IdUtils, NotFoundError, Ok, RepositoryError, type TeamId } from '@team-pulse/shared'
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
    describe('successful deletion', () => {
      it('should delete an existing team', async () => {
        // Arrange
        // We create a random team instance to simulate the database record
        const team = buildTeam()

        // 1. Simulate finding the team successfully
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        // 2. Simulate successful deletion
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        const result = await deleteTeamUseCase.execute({ id: team.id })

        // Assert
        expectSuccess(result)

        // Verify flow: Find -> Delete
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: team.id })
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: team.id })
      })
    })

    describe('error cases', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        // Generate a random ID that doesn't exist
        const nonExistentId = IdUtils.generate<TeamId>()

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await deleteTeamUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('Team')
        expect(error.metadata?.identifier).toBe(nonExistentId)

        // CRITICAL: Ensure we didn't try to delete anything
        expect(teamRepository.delete).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when finding team fails', async () => {
        // Arrange
        const id = IdUtils.generate<TeamId>()
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

        // 1. Find works
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))
        // 2. Delete fails
        vi.mocked(teamRepository.delete).mockResolvedValue(Err(dbError))

        // Act
        const result = await deleteTeamUseCase.execute({ id: team.id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)

        // Ensure delete was actually attempted
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: team.id })
      })
    })
  })
})
