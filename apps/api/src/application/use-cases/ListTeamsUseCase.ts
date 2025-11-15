import type { TeamsListResponseDTO } from '@team-pulse/shared'
import type { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { ValidationError } from '../../domain/errors/ValidationError.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import { Pagination } from '../../domain/value-objects/index.js'

/**
 * List Teams Use Case
 *
 * Retrieves teams with pagination support.
 *
 * Uses Pagination Value Object to:
 * - Encapsulate pagination logic
 * - Validate pagination parameters
 * - Calculate totalPages automatically
 * - Maintain domain invariants
 */
export class ListTeamsUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): ListTeamsUseCase {
    return new ListTeamsUseCase({ teamRepository })
  }

  async execute({
    page = 1,
    limit = 10,
  }: {
    page?: number
    limit?: number
  } = {}): Promise<Result<TeamsListResponseDTO, RepositoryError | ValidationError>> {
    const findTeamResult = await this.teamRepository.findAllPaginated({ page, limit })

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    const { teams, total } = findTeamResult.value

    // Create Pagination Value Object with validation
    const paginationResult = Pagination.create({ page, limit, total })
    if (!paginationResult.ok) {
      return Err(paginationResult.error)
    }

    return Ok({
      pagination: paginationResult.value.toDTO(),
      teams: teams.map((team) => team.toDTO()),
    })
  }
}
