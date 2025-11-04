import type { Team, User } from '../../../domain/entities'
import { type DomainError, NotFoundError } from '../../../domain/errors'
import type { ITeamRepository } from '../../../domain/repositories'
import { canViewTeams } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'

/**
 * Get Team Use Case
 * Orchestrates fetching a single team by ID
 */
export class GetTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  /**
   * Execute get team
   * Returns [error, null] or [null, team]
   */
  async execute(teamId: string, currentUser: User | null): Promise<Result<Team, DomainError>> {
    // Check permissions
    const [permissionError] = canViewTeams(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Get team from repository
    const [error, team] = await this.teamRepository.findById(teamId)

    if (error) {
      return Err(error)
    }

    // Check if team exists
    if (!team) {
      return Err(NotFoundError.entity('Team', teamId))
    }

    return [null, team]
  }
}
