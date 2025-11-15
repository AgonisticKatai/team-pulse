import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError, RepositoryError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok } from '../../domain/types/Result.js'
import { buildTeam, expectError, expectErrorType, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { DeleteTeamUseCase } from './DeleteTeamUseCase.js'

describe('DeleteTeamUseCase', () => {
  let deleteTeamUseCase: DeleteTeamUseCase
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
    deleteTeamUseCase = DeleteTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful deletion', () => {
      it('should return Ok when team is deleted successfully', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        const result = expectSuccess(await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(result).toBeUndefined()
      })

      it('should call teamRepository.findById with correct id', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid)

        // Assert
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: TEST_CONSTANTS.mockUuid })
        expect(teamRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should call teamRepository.delete with correct id', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid)

        // Assert
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: TEST_CONSTANTS.mockUuid })
        expect(teamRepository.delete).toHaveBeenCalledTimes(1)
      })

      it('should verify team exists before attempting deletion', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid)

        // Assert
        // findById should be called before delete
        const findByIdOrder = vi.mocked(teamRepository.findById).mock.invocationCallOrder[0]
        const deleteOrder = vi.mocked(teamRepository.delete).mock.invocationCallOrder[0]
        expect(findByIdOrder).toBeLessThan(deleteOrder!)
      })
    })

    describe('not found errors', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toContain('Team')
        expect(error.message).toContain(TEST_CONSTANTS.mockUuid)
        expect(teamRepository.delete).not.toHaveBeenCalled()
      })

      it('should not attempt deletion if team does not exist', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid)

        // Assert
        expect(teamRepository.delete).not.toHaveBeenCalled()
      })

      it('should return NotFoundError for non-existent id', async () => {
        // Arrange
        const nonExistentId = 'non-existent-id'
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await deleteTeamUseCase.execute(nonExistentId))

        // Assert
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toContain(nonExistentId)
      })
    })

    describe('repository errors', () => {
      it('should return RepositoryError when deletion fails', async () => {
        // Arrange
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Err(RepositoryError.create({ message: 'Failed to delete team' })))

        // Act
        const error = expectError(await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toContain('Failed to delete team')
      })

      it('should return RepositoryError if delete returns false', async () => {
        // Arrange - this is defensive programming, should never happen
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Err(RepositoryError.create({ message: 'Failed to delete team', operation: 'delete' })))

        // Act
        const error = expectErrorType({
          errorType: RepositoryError,
          result: await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid),
        })

        // Assert
        expect(error.operation).toBe('delete')
      })
    })

    describe('edge cases', () => {
      it('should handle deletion of team with different ids', async () => {
        // Arrange
        const differentId = 'different-team-id'
        const differentTeam = buildTeam({ id: differentId })
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(differentTeam))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        const result = expectSuccess(await deleteTeamUseCase.execute(differentId))

        // Assert
        expect(result).toBeUndefined()
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: differentId })
        expect(teamRepository.delete).toHaveBeenCalledWith({ id: differentId })
      })

      it('should handle deletion of team without founded year', async () => {
        // Arrange
        const teamWithoutYear = buildTeam({ foundedYear: null })
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(teamWithoutYear))
        vi.mocked(teamRepository.delete).mockResolvedValue(Ok(undefined))

        // Act
        const result = expectSuccess(await deleteTeamUseCase.execute(TEST_CONSTANTS.mockUuid))

        // Assert
        expect(result).toBeUndefined()
      })
    })
  })
})
