import type { TeamResponseDTO, TeamsListResponseDTO } from '@team-pulse/shared'
import type { Team } from '../../domain/models/Team.js'
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
      teams: teams.map((team) => this.mapToResponseDTO(team)),
      total: teams.length,
    }
  }

  private mapToResponseDTO(team: Team): TeamResponseDTO {
    const obj = team.toObject()
    return {
      city: obj.city,
      createdAt: obj.createdAt.toISOString(),
      foundedYear: obj.foundedYear,
      id: obj.id,
      name: obj.name,
      updatedAt: obj.updatedAt.toISOString(),
    }
  }
}
