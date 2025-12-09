import { GetTeamUseCase } from '@application/use-cases/GetTeamUseCase.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@infrastructure/testing/index.js'
import { Err, IdUtils, NotFoundError, Ok, RepositoryError, type TeamId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
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
    describe('successful retrieval', () => {
      it('should return team DTO when team exists', async () => {
        // Arrange
        const team = buildTeam() // Create a valid, random team entity

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))

        // Act
        const result = await getTeamUseCase.execute({ id: team.id })

        // Assert
        const dto = expectSuccess(result)

        // Verify repository interaction
        expect(teamRepository.findById).toHaveBeenCalledWith({ id: team.id })

        // Verify DTO Mapping
        expect(dto.id).toBe(team.id)
        expect(dto.name).toBe(team.name.getValue())
        expect(dto.city).toBe(team.city.getValue())
        expect(dto.foundedYear).toBe(team.foundedYear?.getValue())

        // Verify ISO Date conversion
        expect(dto.createdAt).toBe(team.createdAt.toISOString())
        expect(dto.updatedAt).toBe(team.updatedAt.toISOString())
      })

      it('should handle team without founded year correctly', async () => {
        // Arrange
        const team = buildTeam({ foundedYear: null })

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(team))

        // Act
        const result = await getTeamUseCase.execute({ id: team.id })

        // Assert
        const dto = expectSuccess(result)
        expect(dto.foundedYear).toBeNull()
      })
    })

    describe('error cases', () => {
      it('should return NotFoundError when team does not exist', async () => {
        // Arrange
        const nonExistentId = IdUtils.generate<TeamId>()

        vi.mocked(teamRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await getTeamUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('Team')
        expect(error.metadata?.identifier).toBe(nonExistentId)
      })

      it('should return RepositoryError when database fails', async () => {
        // Arrange
        const id = IdUtils.generate<TeamId>()
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
