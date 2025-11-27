import { randomUUID } from 'node:crypto'
import type { RepositoryError } from '@domain/errors/index.js'
import { User } from '@domain/models/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import type { CreateUserDTO, UserResponseDTO } from '@team-pulse/shared/dtos'
import type { ValidationError } from '@team-pulse/shared/errors'
import { ConflictError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

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

  private constructor({ userRepository, passwordHasher }: { userRepository: IUserRepository; passwordHasher: IPasswordHasher }) {
    this.userRepository = userRepository
    this.passwordHasher = passwordHasher
  }

  static create({ userRepository, passwordHasher }: { userRepository: IUserRepository; passwordHasher: IPasswordHasher }): CreateUserUseCase {
    return new CreateUserUseCase({ userRepository, passwordHasher })
  }

  async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, ConflictError | RepositoryError | ValidationError>> {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findUserResult.ok) {
      return Err(findUserResult.error)
    }

    if (findUserResult.value) {
      return Err(ConflictError.duplicate({ resource: 'User', identifier: dto.email }))
    }

    const hashResult = await this.passwordHasher.hash({ password: dto.password })

    if (!hashResult.ok) {
      return Err(hashResult.error)
    }

    const createUserResult = User.create({ email: dto.email, id: randomUUID(), passwordHash: hashResult.value, role: dto.role })

    if (!createUserResult.ok) {
      return Err(createUserResult.error)
    }

    const saveUserResult = await this.userRepository.save({ user: createUserResult.value })

    if (!saveUserResult.ok) {
      return Err(saveUserResult.error)
    }

    return Ok(saveUserResult.value.toDTO())
  }
}
