import { NotFoundError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'

/**
 * Delete Team Use Case
 *
 * Deletes a team by ID
 */
export class DeleteTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(id: string): Promise<void> {
    // Verify team exists before deleting
    const team = await this.teamRepository.findById(id)
    if (!team) {
      throw new NotFoundError('Team', id)
    }

    // Delete
    const deleted = await this.teamRepository.delete(id)

    // This should never happen if findById succeeded, but defensive programming
    if (!deleted) {
      throw new Error('Failed to delete team')
    }
  }
}
