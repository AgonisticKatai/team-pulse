import { randomUUID } from 'node:crypto'

import type { CreateTeamDTO, TeamResponseDTO } from '@team-pulse/shared'

import {
  DuplicatedError,
  type RepositoryError,
  type ValidationError,
} from '../../domain/errors/index.js'
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

  static create({ teamRepository }: { teamRepository: ITeamRepository }): CreateTeamUseCase {
    return new CreateTeamUseCase({ teamRepository })
  }

  async execute(
    dto: CreateTeamDTO,
  ): Promise<Result<TeamResponseDTO, DuplicatedError | RepositoryError | ValidationError>> {
    const findResult = await this.teamRepository.findByName({ name: dto.name })

    if (!findResult.ok) {
      return Err(findResult.error)
    }

    const existingTeam = findResult.value

    if (existingTeam) {
      return Err(
        DuplicatedError.create({
          entityName: 'Team',
          identifier: dto.name,
        }),
      )
    }

    const createResult = Team.create({
      city: dto.city,
      foundedYear: dto.foundedYear ?? undefined,
      id: randomUUID(),
      name: dto.name,
    })

    if (!createResult.ok) {
      return Err(createResult.error)
    }

    const saveResult = await this.teamRepository.save(createResult.value)

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    return Ok(saveResult.value.toDTO())
  }
}
