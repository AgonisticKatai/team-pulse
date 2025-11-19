import { randomUUID } from 'node:crypto'

import { type CreateTeamDTO, Err, Ok, type Result, type TeamResponseDTO } from '@team-pulse/shared'

import { DuplicatedError, type RepositoryError, type ValidationError } from '../../domain/errors/index.js'
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
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): CreateTeamUseCase {
    return new CreateTeamUseCase({ teamRepository })
  }

  async execute(dto: CreateTeamDTO): Promise<Result<TeamResponseDTO, DuplicatedError | RepositoryError | ValidationError>> {
    const findTeamResult = await this.teamRepository.findByName({ name: dto.name })

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    if (findTeamResult.value) {
      return Err(DuplicatedError.create({ entityName: 'Team', identifier: dto.name }))
    }

    const createTeamResult = Team.create({ city: dto.city, foundedYear: dto.foundedYear ?? undefined, id: randomUUID(), name: dto.name })

    if (!createTeamResult.ok) {
      return Err(createTeamResult.error)
    }

    const saveTeamResult = await this.teamRepository.save({ team: createTeamResult.value })

    if (!saveTeamResult.ok) {
      return Err(saveTeamResult.error)
    }

    return Ok(saveTeamResult.value.toDTO())
  }
}
