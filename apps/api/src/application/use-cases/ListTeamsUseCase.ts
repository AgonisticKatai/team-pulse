import type { TeamsListResponseDTO } from '@team-pulse/shared'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Ok, type Result } from '../../domain/types/index.js'

/**
 * List Teams Use Case
 *
 * Retrieves all teams
 * Future: Add pagination, filtering, sorting
 */
export class ListTeamsUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  /**
   * Factory method to create the use case
   *
   * Use named parameters for consistency with domain entities
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): ListTeamsUseCase {
    return new ListTeamsUseCase({ teamRepository })
  }

  async execute(): Promise<Result<TeamsListResponseDTO, never>> {
    const teams = await this.teamRepository.findAll()

    return Ok({
      teams: teams.map((team) => team.toDTO()),
      total: teams.length,
    })
  }
}
