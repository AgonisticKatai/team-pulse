import { UserMapper } from '@application/mappers/UserMapper.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { RepositoryError, UserId, UserResponseDTO } from '@team-pulse/shared'
import { Err, NotFoundError, Ok, type Result } from '@team-pulse/shared'

/**
 * Get User Use Case
 *
 * Retrieves a single user by ID
 */
export class GetUserUseCase {
  private readonly userRepository: IUserRepository

  private constructor({ userRepository }: { userRepository: IUserRepository }) {
    this.userRepository = userRepository
  }

  static create({ userRepository }: { userRepository: IUserRepository }): GetUserUseCase {
    return new GetUserUseCase({ userRepository })
  }

  async execute({ id }: { id: UserId }): Promise<Result<UserResponseDTO, NotFoundError | RepositoryError>> {
    const findUserResult = await this.userRepository.findById({ id })

    if (!findUserResult.ok) return Err(findUserResult.error)

    if (!findUserResult.value) return Err(NotFoundError.forResource({ identifier: id, resource: 'User' }))

    return Ok(UserMapper.toDTO(findUserResult.value))
  }
}
