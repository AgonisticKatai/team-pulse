import { UpdateTeamUseCase } from '@application/use-cases/UpdateTeamUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { buildExistingTeam, buildTeam } from '@infrastructure/testing/index.js'
import type { UpdateTeamDTO } from '@team-pulse/shared/dtos'
import { ConflictError, NotFoundError, RepositoryError, ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectError, expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('UpdateTeamUseCase', () => {
  let updateTeamUseCase: UpdateTeamUseCase
  let teamRepository: ITeamRepository

  // Mock team data
  const mockTeam = buildTeam()
  const existingTeam = buildExistingTeam()

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
    updateTeamUseCase = UpdateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful team update', () => {
      it('should return Ok with updated team data when update succeeds', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: 'New City',
          foundedYear: 1950,
          name: 'Updated Team',
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(team.id).toBe(TEST_CONSTANTS.mockUuid)
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: TEST_CONSTANTS.mockUuid })
        expect(teamRepository.save).toHaveBeenCalled()
      })

      it('should allow partial updates', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: 'New City',
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(team).toBeDefined()
        expect(teamRepository.save).toHaveBeenCalled()
      })

      it('should update team without checking name if name is not changed', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: 'New City',
          foundedYear: 1950,
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto)

        // Assert
        expect(teamRepository.findByName).not.toHaveBeenCalled()
      })

      it('should check name uniqueness if name is changed', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          name: 'New Team Name',
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto)

        // Assert
        expect(teamRepository.findByName).toHaveBeenCalledWith({ name: 'New Team Name' })
      })

      it('should allow same team to keep its own name', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          name: TEST_CONSTANTS.teams.fcBarcelona.name,
        }

        // Return the same team when checking by name
        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const result = await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto)

        // Assert
        expectSuccess(result)
      })
    })

    describe('validation errors', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: 'New City',
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const error = expectError(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.message).toContain('Team')
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return ConflictError when new name already exists for different team', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          name: 'Existing Team Name',
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam))

        // Act
        const error = expectErrorType({
          errorType: ConflictError,
          result: await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto),
        })

        // Assert
        expect(error.message).toContain('already exists')
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return ValidationError when team update validation fails', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: '', // Invalid: empty city
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        const error = expectError(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return ValidationError for invalid founded year', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          foundedYear: 3000, // Future year
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))

        // Act
        const error = expectError(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(teamRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('repository errors', () => {
      it('should return RepositoryError when findByName fails', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          name: 'New Team Name',
        }

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'findByName',
        })

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.findByName).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toContain(TEST_CONSTANTS.errors.databaseConnectionLost)
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when save fails', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          city: 'New City',
        }

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'save',
        })

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toContain(TEST_CONSTANTS.errors.databaseConnectionLost)
      })
    })

    describe('edge cases', () => {
      it('should handle empty update DTO', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {}

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(team).toBeDefined()
      })

      it('should handle setting founded year to null', async () => {
        // Arrange
        const dto: UpdateTeamDTO = {
          foundedYear: null,
        }

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(mockTeam))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam))

        // Act
        const team = expectSuccess(await updateTeamUseCase.execute(TEST_CONSTANTS.mockUuid, dto))

        // Assert
        expect(team).toBeDefined()
      })
    })
  })
})
