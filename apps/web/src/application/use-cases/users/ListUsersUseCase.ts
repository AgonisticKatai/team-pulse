import type { User } from '../../../domain/entities'
import type { DomainError } from '../../../domain/errors'
import type { IUserRepository } from '../../../domain/repositories'
import { canListUsers } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'

/**
 * List Users Use Case
 * Orchestrates listing all users
 */
export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute list users
   * Returns [error, null] or [null, users[]]
   */
  async execute(currentUser: User | null): Promise<Result<User[], DomainError>> {
    // Check permissions
    const [permissionError] = canListUsers(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Get users from repository
    const [error, users] = await this.userRepository.findAll()

    if (error) {
      return Err(error)
    }

    return [null, users]
  }
}
