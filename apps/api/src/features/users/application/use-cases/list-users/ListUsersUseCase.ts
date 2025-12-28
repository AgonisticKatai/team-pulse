import { UserMapper } from '@features/users/application/mappers/user/UserMapper.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { IMetricsService } from '@shared/monitoring/IMetricsService.js'
import type { PaginationQueryDTO, RepositoryError, UsersListResponseDTO, ValidationError } from '@team-pulse/shared'
import { Err, Ok, Pagination, type Result } from '@team-pulse/shared'

/**
 * List Users Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Lists users in the system with pagination support
 * - Only accessible by SUPER_ADMIN and ADMIN roles
 *
 * Responsibilities:
 * 1. Fetch paginated users from repository
 * 2. Map to response DTOs (WITHOUT password hashes)
 * 3. Use Pagination Value Object for domain logic
 *
 * Uses Pagination Value Object to:
 * - Encapsulate pagination logic
 * - Validate pagination parameters
 * - Calculate totalPages automatically
 * - Maintain domain invariants
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 * Authorization is handled by middleware at the HTTP layer.
 */
export class ListUsersUseCase {
  private readonly metricsService: IMetricsService
  private readonly userRepository: IUserRepository

  private constructor({
    metricsService,
    userRepository,
  }: { metricsService: IMetricsService; userRepository: IUserRepository }) {
    this.metricsService = metricsService
    this.userRepository = userRepository
  }

  static create({
    metricsService,
    userRepository,
  }: {
    metricsService: IMetricsService
    userRepository: IUserRepository
  }): ListUsersUseCase {
    return new ListUsersUseCase({ metricsService, userRepository })
  }

  async execute({
    dto,
  }: {
    dto: Partial<PaginationQueryDTO>
  }): Promise<Result<UsersListResponseDTO, RepositoryError | ValidationError>> {
    const { page = 1, limit = 10 } = dto

    const findUserResult = await this.userRepository.findAllPaginated({ limit, page })

    if (!findUserResult.ok) return Err(findUserResult.error)

    const { users, total } = findUserResult.value

    this.metricsService.setUsersTotal({ count: total })

    const paginationResult = Pagination.create({ limit, page, total })

    if (!paginationResult.ok) return Err(paginationResult.error)

    return Ok(UserMapper.toPaginatedList(users, paginationResult.value.toDTO()))
  }
}
