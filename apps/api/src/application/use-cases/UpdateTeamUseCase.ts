import type { TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { DuplicatedError, NotFoundError, type RepositoryError, type ValidationError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * Update Team Use Case
 *
 * Updates an existing team
 */
export class UpdateTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  /**
   * Factory method to create the use case
   *
   * Use named parameters for consistency with domain entities
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): UpdateTeamUseCase {
    return new UpdateTeamUseCase({ teamRepository })
  }

  async execute(
    id: string,
    dto: UpdateTeamDTO,
  ): Promise<Result<TeamResponseDTO, DuplicatedError | NotFoundError | ValidationError | RepositoryError>> {
    // Find existing team by ID
    const existingTeam = await this.teamRepository.findById({ id })

    // Handle repository errors
    if (!existingTeam.ok) {
      return Err(existingTeam.error)
    }

    // Handle not found
    if (!existingTeam.value) {
      return Err(NotFoundError.create({ entityName: 'Team', identifier: id }))
    }

    const team = existingTeam.value

    // Business Rule: If updating name, check uniqueness
    if (dto.name && dto.name !== team.name.getValue()) {
      // Check if another team with the same name exists
      const findResult = await this.teamRepository.findByName({ name: dto.name })

      // Handle repository errors
      if (!findResult.ok) {
        return Err(findResult.error)
      }

      const existingTeamWithSameName = findResult.value

      if (existingTeamWithSameName && existingTeamWithSameName.id.getValue() !== id) {
        return Err(DuplicatedError.create({ entityName: 'Team', identifier: dto.name }))
      }
    }

    // Update domain entity (immutable update)
    const updateResult = team.update({
      city: dto.city,
      foundedYear: dto.foundedYear,
      name: dto.name,
    })

    if (!updateResult.ok) {
      return Err(updateResult.error)
    }

    // Persist - TypeScript knows updateResult.value is Team (no ! needed)
    const saveResult = await this.teamRepository.save(updateResult.value)

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    return Ok(saveResult.value.toDTO())
  }
}
