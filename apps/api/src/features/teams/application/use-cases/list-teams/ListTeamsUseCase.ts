import { TeamMapper } from '@features/teams/application/mappers/team/TeamMapper.js'
import type { ITeamRepository } from '@features/teams/domain/repositories/team/ITeamRepository.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import type { PaginationQueryDTO, RepositoryError, TeamsListResponseDTO, ValidationError } from '@team-pulse/shared'
import { Err, Ok, Pagination, type Result } from '@team-pulse/shared'

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
  private readonly metricsService: IMetricsService
  private readonly teamRepository: ITeamRepository

  private constructor({
    metricsService,
    teamRepository,
  }: { metricsService: IMetricsService; teamRepository: ITeamRepository }) {
    this.metricsService = metricsService
    this.teamRepository = teamRepository
  }

  static create({
    metricsService,
    teamRepository,
  }: {
    metricsService: IMetricsService
    teamRepository: ITeamRepository
  }): ListTeamsUseCase {
    return new ListTeamsUseCase({ metricsService, teamRepository })
  }

  async execute({
    dto,
  }: {
    dto: Partial<PaginationQueryDTO>
  }): Promise<Result<TeamsListResponseDTO, RepositoryError | ValidationError>> {
    const { page = 1, limit = 10 } = dto

    const findTeamResult = await this.teamRepository.findAllPaginated({ limit, page })

    if (!findTeamResult.ok) return Err(findTeamResult.error)

    const { teams, total } = findTeamResult.value

    this.metricsService.setTeamsTotal({ count: total })

    const paginationResult = Pagination.create({ limit, page, total })

    if (!paginationResult.ok) return Err(paginationResult.error)

    return Ok(TeamMapper.toPaginatedList(teams, paginationResult.value.toDTO()))
  }
}
