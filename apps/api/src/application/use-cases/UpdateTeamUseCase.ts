import { NotFoundError, ValidationError } from '../../domain/errors/index.js'
import type { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import type { TeamResponseDTO, UpdateTeamDTO } from '../dtos/TeamDTO.js'

/**
 * Update Team Use Case
 *
 * Updates an existing team
 */
export class UpdateTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(id: string, dto: UpdateTeamDTO): Promise<TeamResponseDTO> {
    // Find existing team
    const existingTeam = await this.teamRepository.findById(id)
    if (!existingTeam) {
      throw new NotFoundError('Team', id)
    }

    // Business Rule: If updating name, check uniqueness
    if (dto.name && dto.name !== existingTeam.name) {
      const teamWithSameName = await this.teamRepository.findByName(dto.name)
      if (teamWithSameName && teamWithSameName.id !== id) {
        throw new ValidationError(`A team with name "${dto.name}" already exists`, 'name')
      }
    }

    // Update domain entity (immutable update)
    const updatedTeam = existingTeam.update({
      name: dto.name,
      city: dto.city,
      foundedYear: dto.foundedYear,
    })

    // Persist
    const savedTeam = await this.teamRepository.save(updatedTeam)

    return this.mapToResponseDTO(savedTeam)
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
