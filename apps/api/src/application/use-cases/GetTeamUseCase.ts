import { NotFoundError } from '../../domain/errors/index.js'
import type { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import type { TeamResponseDTO } from '../dtos/TeamDTO.js'

/**
 * Get Team Use Case
 *
 * Retrieves a single team by ID
 */
export class GetTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(id: string): Promise<TeamResponseDTO> {
    const team = await this.teamRepository.findById(id)

    if (!team) {
      throw new NotFoundError('Team', id)
    }

    return this.mapToResponseDTO(team)
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
