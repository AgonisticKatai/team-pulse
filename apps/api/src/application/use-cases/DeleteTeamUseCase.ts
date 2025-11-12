import { NotFoundError, RepositoryError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * Delete Team Use Case
 *
 * Deletes a team by ID
 */
export class DeleteTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  /**
   * Factory method to create the use case
   *
   * Use named parameters for consistency with domain entities
   */
  static create({ teamRepository }: { teamRepository: ITeamRepository }): DeleteTeamUseCase {
    return new DeleteTeamUseCase({ teamRepository })
  }

  async execute(id: string): Promise<Result<void, NotFoundError | RepositoryError>> {
    // Verify team exists before deleting
    const team = await this.teamRepository.findById(id)
    if (!team) {
      return Err(new NotFoundError('Team', id))
    }

    // Delete
    const deleted = await this.teamRepository.delete(id)

    // This should never happen if findById succeeded, but defensive programming
    if (!deleted) {
      return Err(
        RepositoryError.forOperation({
          message: 'Failed to delete team',
          operation: 'delete',
        }),
      )
    }

    return Ok(undefined)
  }
}
