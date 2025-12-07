import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { TeamId } from '@team-pulse/shared/domain/ids'
import type { TeamResponseDTO } from '@team-pulse/shared/dtos'
import type { RepositoryError } from '@team-pulse/shared/errors'
import { NotFoundError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

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

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    if (!findTeamResult.value) {
      return Err(NotFoundError.forResource({ identifier: id, resource: 'Team' }))
    }

    return Ok(findTeamResult.value.toDTO())
  }
}
