import { randomUUID } from 'node:crypto'
import type { CreateTeamDTO, TeamResponseDTO } from '@team-pulse/shared'
import { ValidationError } from '../../domain/errors/index.js'
import { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'

/**
 * Create Team Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates domain objects to accomplish a user goal
 * - Contains application-specific logic (not domain logic)
 * - Coordinates infrastructure (repositories)
 * - Handles transactions (if needed)
 * - Maps between DTOs and domain entities
 *
 * Responsibilities:
 * 1. Validate business rules (beyond what DTOs validate)
 * 2. Check for conflicts (team name uniqueness)
 * 3. Create domain entity
 * 4. Persist via repository
 * 5. Map to response DTO
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 */
export class CreateTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(dto: CreateTeamDTO): Promise<TeamResponseDTO> {
    // Business Rule: Team name must be unique
    const existingTeam = await this.teamRepository.findByName(dto.name)
    if (existingTeam) {
      throw new ValidationError(`A team with name "${dto.name}" already exists`, 'name')
    }

    // Create domain entity
    // The Team entity validates its own invariants
    const team = Team.create({
      city: dto.city,
      foundedYear: dto.foundedYear ?? undefined,
      id: randomUUID(),
      name: dto.name,
    })

    // Persist
    const savedTeam = await this.teamRepository.save(team)

    // Map to response DTO
    return this.mapToResponseDTO(savedTeam)
  }

  /**
   * Map domain entity to response DTO
   *
   * This is where you control what data goes to the client
   */
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
