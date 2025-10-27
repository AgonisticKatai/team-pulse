import type { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import type { TeamResponseDTO, TeamsListResponseDTO } from '../dtos/TeamDTO.js'

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
      id: obj.id,
      name: obj.name,
      city: obj.city,
      foundedYear: obj.foundedYear,
      createdAt: obj.createdAt.toISOString(),
      updatedAt: obj.updatedAt.toISOString(),
    }
  }
}
