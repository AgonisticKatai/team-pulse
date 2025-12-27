import { TeamMapper } from '@application/mappers/TeamMapper.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { RepositoryError, TeamId, TeamResponseDTO } from '@team-pulse/shared'
import { Err, NotFoundError, Ok, type Result } from '@team-pulse/shared'

/**
 * Get Team Use Case
 *
 * Retrieves a single team by ID
 */
export class GetTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): GetTeamUseCase {
    return new GetTeamUseCase({ teamRepository })
  }

  async execute({ id }: { id: TeamId }): Promise<Result<TeamResponseDTO, NotFoundError | RepositoryError>> {
    const findTeamResult = await this.teamRepository.findById({ id })

    if (!findTeamResult.ok) return Err(findTeamResult.error)

    if (!findTeamResult.value) return Err(NotFoundError.forResource({ identifier: id, resource: 'Team' }))

    return Ok(TeamMapper.toDTO(findTeamResult.value))
  }
}
