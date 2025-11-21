import { NotFoundError, type RepositoryError } from '@domain/errors/index.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { TeamResponseDTO } from '@team-pulse/shared/dtos'
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

  async execute(id: string): Promise<Result<TeamResponseDTO, NotFoundError | RepositoryError>> {
    const findTeamResult = await this.teamRepository.findById({ id })

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    if (!findTeamResult.value) {
      return Err(NotFoundError.create({ entityName: 'Team', identifier: id }))
    }

    return Ok(findTeamResult.value.toDTO())
  }
}
