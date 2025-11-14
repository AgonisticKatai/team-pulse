import type { TeamsListResponseDTO } from '@team-pulse/shared'
import type { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * List Teams Use Case
 *
 * Retrieves all teams
 * Future: Add pagination, filtering, sorting
 */
export class ListTeamsUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): ListTeamsUseCase {
    return new ListTeamsUseCase({ teamRepository })
  }

  async execute(): Promise<Result<TeamsListResponseDTO, RepositoryError>> {
    const findTeamResult = await this.teamRepository.findAll()

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    return Ok({
      teams: findTeamResult.value.map((team) => team.toDTO()),
      total: findTeamResult.value.length,
    })
  }
}
