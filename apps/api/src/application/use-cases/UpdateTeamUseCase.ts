import type { TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { NotFoundError, ValidationError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'

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
    if (dto.name && dto.name !== existingTeam.name.getValue()) {
      const teamWithSameName = await this.teamRepository.findByName(dto.name)
      if (teamWithSameName && teamWithSameName.id.getValue() !== id) {
        throw new ValidationError(`A team with name "${dto.name}" already exists`, 'name')
      }
    }

    // Update domain entity (immutable update)
    const [error, updatedTeam] = existingTeam.update({
      city: dto.city,
      foundedYear: dto.foundedYear,
      name: dto.name,
    })

    if (error) {
      throw error
    }

    // Persist
    const savedTeam = await this.teamRepository.save(updatedTeam!)

    return savedTeam.toDTO()
  }
}
