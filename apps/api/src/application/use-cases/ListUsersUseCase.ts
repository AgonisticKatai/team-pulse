import type { UsersListResponseDTO } from '@team-pulse/shared'
import type { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * List Users Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Lists all users in the system
 * - Only accessible by SUPER_ADMIN and ADMIN roles
 *
 * Responsibilities:
 * 1. Fetch all users from repository
 * 2. Map to response DTOs (WITHOUT password hashes)
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

  async execute(): Promise<Result<UsersListResponseDTO, RepositoryError>> {
    const findUserResult = await this.userRepository.findAll()

    if (!findUserResult.ok) {
      return Err(findUserResult.error)
    }

    return Ok({
      total: findUserResult.value.length,
      users: findUserResult.value.map((user) => user.toDTO()),
    })
  }
}
