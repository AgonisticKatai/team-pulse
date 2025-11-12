import type { TeamResponseDTO } from '@team-pulse/shared'
import { NotFoundError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

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

  /**
   * Factory method to create the use case
   *
   * Use named parameters for consistency with domain entities
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): GetTeamUseCase {
    return new GetTeamUseCase({ teamRepository })
  }

  async execute(id: string): Promise<Result<TeamResponseDTO, NotFoundError>> {
    const team = await this.teamRepository.findById(id)

    if (!team) {
      return Err(new NotFoundError('Team', id))
    }

    return Ok(team.toDTO())
  }
}
