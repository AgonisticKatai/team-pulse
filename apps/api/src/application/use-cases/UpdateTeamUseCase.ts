import type { TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { NotFoundError, type RepositoryError, ValidationError } from '../../domain/errors/index.js'
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
  ): Promise<Result<TeamResponseDTO, NotFoundError | ValidationError | RepositoryError>> {
    // Find existing team
    const existingTeam = await this.teamRepository.findById(id)
    if (!existingTeam) {
      return Err(new NotFoundError('Team', id))
    }

    // Business Rule: If updating name, check uniqueness
    if (dto.name && dto.name !== existingTeam.name.getValue()) {
      const findResult = await this.teamRepository.findByName(dto.name)

      if (!findResult.ok) {
        return Err(findResult.error)
      }

      if (findResult.value && findResult.value.id.getValue() !== id) {
        return Err(new ValidationError(`A team with name "${dto.name}" already exists`, 'name'))
      }
    }

    // Update domain entity (immutable update)
    const updateResult = existingTeam.update({
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
