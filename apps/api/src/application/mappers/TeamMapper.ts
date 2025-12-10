import type { Team } from '@domain/models/team/Team.js'
import type { PaginationDTO, TeamResponseDTO, TeamsListResponseDTO } from '@team-pulse/shared'

export class TeamMapper {
  private constructor() {}

  static toDTO(team: Team): TeamResponseDTO {
    const primitives = team.toPrimitives()

    return {
      city: primitives.city,
      createdAt: primitives.createdAt.toISOString(),
      foundedYear: primitives.foundedYear,
      id: primitives.id,
      name: primitives.name,
      updatedAt: primitives.updatedAt.toISOString(),
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
