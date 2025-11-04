import type { Team, User } from '../../../domain/entities'
import type { DomainError } from '../../../domain/errors'
import type { ITeamRepository } from '../../../domain/repositories'
import { canViewTeams } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'

/**
 * List Teams Use Case output
 */
export interface ListTeamsUseCaseOutput {
  teams: Team[]
  total: number
}

/**
 * List Teams Use Case
 * Orchestrates listing all teams
 */
export class ListTeamsUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  /**
   * Execute list teams
   * Returns [error, null] or [null, { teams, total }]
   */
  async execute(currentUser: User | null): Promise<Result<ListTeamsUseCaseOutput, DomainError>> {
    // Check permissions
    const [permissionError] = canViewTeams(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Get teams from repository
    const [error, response] = await this.teamRepository.findAll()

    if (error) {
      return Err(error)
    }

    return [null, response]
  }
}
