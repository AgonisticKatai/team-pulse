import { User } from '@domain/models/user/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import type { CreateUserDTO, RepositoryError, UserResponseDTO, ValidationError } from '@team-pulse/shared'
import { ConflictError, Err, IdUtils, Ok, type Result, type UserId } from '@team-pulse/shared'

/**
 * Create User Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates domain objects to accomplish a user goal
 * - Contains application-specific logic (not domain logic)
 * - Coordinates infrastructure (repositories, password hashing)
 * - Maps between DTOs and domain entities
 *
 * Responsibilities:
 * 1. Validate business rules (email uniqueness)
 * 2. Hash the password
 * 3. Create domain entity
 * 4. Persist via repository
 * 5. Map to response DTO (WITHOUT password hash)
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 */
export class CreateUserUseCase {
  private readonly userRepository: IUserRepository
  private readonly passwordHasher: IPasswordHasher

  private constructor({
    userRepository,
    passwordHasher,
  }: { userRepository: IUserRepository; passwordHasher: IPasswordHasher }) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
  }

  static create({
    userRepository,
    passwordHasher,
  }: {
    userRepository: IUserRepository
    passwordHasher: IPasswordHasher
  }): CreateUserUseCase {
    return new CreateUserUseCase({ passwordHasher, userRepository })
  }

  async execute({
    dto,
  }: {
    dto: CreateUserDTO
  }): Promise<Result<UserResponseDTO, ConflictError | RepositoryError | ValidationError>> {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findUserResult.ok) return Err(findUserResult.error)

    if (findUserResult.value) return Err(ConflictError.duplicate({ identifier: dto.email, resource: 'User' }))

    const hashResult = await this.passwordHasher.hash({ password: dto.password })

    if (!hashResult.ok) return Err(hashResult.error)

    const createUserResult = User.create({
      email: dto.email,
      id: IdUtils.generate<UserId>(),
      passwordHash: hashResult.value,
      role: dto.role,
    })

    if (!createUserResult.ok) return Err(createUserResult.error)

    const saveUserResult = await this.userRepository.save({ user: createUserResult.value })

    if (!saveUserResult.ok) return Err(saveUserResult.error)

    return Ok(saveUserResult.value.toDTO())
  }
}
