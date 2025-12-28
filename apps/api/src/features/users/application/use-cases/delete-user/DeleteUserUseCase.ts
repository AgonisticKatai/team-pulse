import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { RepositoryError, UserId } from '@team-pulse/shared'
import { Err, NotFoundError, Ok, type Result } from '@team-pulse/shared'

/**
 * Delete User Use Case
 *
 * Deletes a user by ID
 */
export class DeleteUserUseCase {
  private readonly userRepository: IUserRepository

  private constructor({ userRepository }: { userRepository: IUserRepository }) {
    this.userRepository = userRepository
  }

  static create({ userRepository }: { userRepository: IUserRepository }): DeleteUserUseCase {
    return new DeleteUserUseCase({ userRepository })
  }

  async execute({ id }: { id: UserId }): Promise<Result<void, NotFoundError | RepositoryError>> {
    const findUserResult = await this.userRepository.findById({ id })

    if (!findUserResult.ok) return Err(findUserResult.error)

    if (!findUserResult.value) return Err(NotFoundError.forResource({ identifier: id, resource: 'User' }))

    const deleteResult = await this.userRepository.delete({ id })

    if (!deleteResult.ok) return Err(deleteResult.error)

    return Ok(undefined)
  }
}
