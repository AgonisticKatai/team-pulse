import type { TeamsListResponseDTO } from '@team-pulse/shared'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'

/**
 * List Teams Use Case
 *
 * Retrieves all teams
 * Future: Add pagination, filtering, sorting
 */
export class ListTeamsUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(): Promise<TeamsListResponseDTO> {
    const teams = await this.teamRepository.findAll()

    return {
      teams: teams.map((team) => team.toDTO()),
      total: teams.length,
    }
  }
}
