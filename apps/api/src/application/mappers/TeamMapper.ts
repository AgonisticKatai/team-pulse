import type { Team } from '@domain/models/team/Team.js'
import type { PaginationDTO, TeamResponseDTO, TeamsListResponseDTO } from '@team-pulse/shared'

export class TeamMapper {
  private constructor() {}

  static toDTO(team: Team): TeamResponseDTO {
    return {
      createdAt: team.createdAt.toISOString(),
      id: team.id,
      name: team.name.getValue(),
      updatedAt: team.updatedAt.toISOString(),
    }
  }

  static toDTOList(teams: Team[]): TeamResponseDTO[] {
    return teams.map((team) => TeamMapper.toDTO(team))
  }

  static toPaginatedList(teams: Team[], pagination: PaginationDTO): TeamsListResponseDTO {
    return {
      pagination,
      teams: TeamMapper.toDTOList(teams),
    }
  }
}
