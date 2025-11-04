import type { User } from '../../../domain/entities'
import { type DomainError, NotFoundError } from '../../../domain/errors'
import type { ITeamRepository } from '../../../domain/repositories'
import { canDeleteTeam } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'

/**
 * Delete Team Use Case
 * Orchestrates team deletion
 */
export class DeleteTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  /**
   * Execute delete team
   * Returns [error, null] or [null, true]
   */
  async execute(teamId: string, currentUser: User | null): Promise<Result<true, DomainError>> {
    // Check permissions
    const [permissionError] = canDeleteTeam(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Check if team exists
    const [findError, team] = await this.teamRepository.findById(teamId)
    if (findError) {
      return Err(findError)
    }

    if (!team) {
      return Err(NotFoundError.entity('Team', teamId))
    }

    // Delete team via repository
    const [deleteError] = await this.teamRepository.delete(teamId)

    if (deleteError) {
      return Err(deleteError)
    }

    return [null, true]
  }
}
