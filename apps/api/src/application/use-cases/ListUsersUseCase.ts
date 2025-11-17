import type { UsersListResponseDTO } from '@team-pulse/shared'
import type { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { ValidationError } from '../../domain/errors/ValidationError.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import { Pagination } from '../../domain/value-objects/index.js'
import { metricsService } from '../../infrastructure/monitoring/MetricsService.js'

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
  private readonly userRepository: IUserRepository

  private constructor({ userRepository }: { userRepository: IUserRepository }) {
    this.userRepository = userRepository
  }

  static create({ userRepository }: { userRepository: IUserRepository }): ListUsersUseCase {
    return new ListUsersUseCase({ userRepository })
  }

  async execute({
    page = 1,
    limit = 10,
  }: {
    page?: number
    limit?: number
  } = {}): Promise<Result<UsersListResponseDTO, RepositoryError | ValidationError>> {
    const findUserResult = await this.userRepository.findAllPaginated({ page, limit })

    if (!findUserResult.ok) {
      return Err(findUserResult.error)
    }

    const { users, total } = findUserResult.value

    // Update users_total metric
    metricsService.setUsersTotal(total)

    // Create Pagination Value Object with validation
    const paginationResult = Pagination.create({ page, limit, total })
    if (!paginationResult.ok) {
      return Err(paginationResult.error)
    }

    return Ok({
      pagination: paginationResult.value.toDTO(),
      users: users.map((user) => user.toDTO()),
    })
  }
}
