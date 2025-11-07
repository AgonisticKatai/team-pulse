import { randomUUID } from 'node:crypto'

import type { CreateTeamDTO, TeamResponseDTO } from '@team-pulse/shared'

import { type RepositoryError, ValidationError } from '../../domain/errors/index.js'
import { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

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
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  /**
   * Factory method to create the use case
   *
   * Use named parameters for consistency with domain entities
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): CreateTeamUseCase {
    return new CreateTeamUseCase({ teamRepository })
  }

  async execute(
    dto: CreateTeamDTO,
  ): Promise<Result<TeamResponseDTO, ValidationError | RepositoryError>> {
    // Business Rule: Team name must be unique
    const [findError, existingTeam] = await this.teamRepository.findByName(dto.name)

    if (findError) {
      return Err(findError)
    }

    if (existingTeam) {
      return Err(
        ValidationError.forField({
          field: 'name',
          message: `A team with name "${dto.name}" already exists`,
        }),
      )
    }

    // Create domain entity
    // The Team entity validates its own invariants
    const [error, team] = Team.create({
      city: dto.city,
      foundedYear: dto.foundedYear ?? undefined,
      id: randomUUID(),
      name: dto.name,
    })

    if (error) {
      return Err(error)
    }

    // Persist
    const [saveError, savedTeam] = await this.teamRepository.save(team!)

    if (saveError) {
      return Err(saveError)
    }

    // Map to response DTO
    return Ok(savedTeam!.toDTO())
  }
}
