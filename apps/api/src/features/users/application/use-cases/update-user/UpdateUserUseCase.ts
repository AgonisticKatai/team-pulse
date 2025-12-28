import { UserMapper } from '@features/users/application/mappers/user/UserMapper.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'

import type { RepositoryError, UpdateUserDTO, UserId, UserResponseDTO, ValidationError } from '@team-pulse/shared'
import { ConflictError, Err, NotFoundError, Ok, type Result } from '@team-pulse/shared'

/**
 * Update User Use Case
 *
 * Updates an existing user's profile (email, role).
 * Does NOT handle password updates (use separate use case).
 */
export class UpdateUserUseCase {
  private readonly userRepository: IUserRepository

  private constructor({ userRepository }: { userRepository: IUserRepository }) {
    this.userRepository = userRepository
  }

  static create({ userRepository }: { userRepository: IUserRepository }): UpdateUserUseCase {
    return new UpdateUserUseCase({ userRepository })
  }

  async execute({
    id,
    dto,
  }: {
    id: UserId
    dto: UpdateUserDTO
  }): Promise<Result<UserResponseDTO, ConflictError | NotFoundError | ValidationError | RepositoryError>> {
    const findUserResult = await this.userRepository.findById({ id })

    if (!findUserResult.ok) return Err(findUserResult.error)

    if (!findUserResult.value) {
      return Err(NotFoundError.forResource({ identifier: id, resource: 'User' }))
    }

    const currentUser = findUserResult.value

    // Check unique email if changed
    if (dto.email && dto.email !== currentUser.email.getValue()) {
      const findEmailResult = await this.userRepository.findByEmail({ email: dto.email })

      if (!findEmailResult.ok) return Err(findEmailResult.error)

      if (findEmailResult.value && findEmailResult.value.id !== id) {
        return Err(ConflictError.duplicate({ identifier: dto.email, resource: 'User' }))
      }
    }

    const updateResult = currentUser.update(dto)

    if (!updateResult.ok) return Err(updateResult.error)

    const saveResult = await this.userRepository.save({ user: updateResult.value })

    if (!saveResult.ok) return Err(saveResult.error)

    return Ok(UserMapper.toDTO(saveResult.value))
  }
}
