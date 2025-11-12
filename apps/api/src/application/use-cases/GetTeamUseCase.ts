import type { TeamResponseDTO } from '@team-pulse/shared'
import { NotFoundError, type RepositoryError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * Get Team Use Case
 *
 * Retrieves a single team by ID
 */
export class GetTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  /**
   * Factory method to create the use case
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): GetTeamUseCase {
    return new GetTeamUseCase({ teamRepository })
  }

  async execute(id: string): Promise<Result<TeamResponseDTO, NotFoundError | RepositoryError>> {
    // Verify team exists
    const findResult = await this.teamRepository.findById({ id })

    // Handle repository errors
    if (!findResult.ok) {
      return Err(findResult.error)
    }

    // Handle not found
    if (!findResult.value) {
      return Err(NotFoundError.create({ entityName: 'Team', identifier: id }))
    }

    // Map to DTO and return
    return Ok(findResult.value.toDTO())
  }
}
