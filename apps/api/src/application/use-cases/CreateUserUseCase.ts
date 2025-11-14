import { randomUUID } from 'node:crypto'
import type { CreateUserDTO, UserResponseDTO } from '@team-pulse/shared'
import { DuplicatedError, type RepositoryError, type ValidationError } from '../../domain/errors/index.js'
import { User } from '../../domain/models/User.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import { hashPassword } from '../../infrastructure/auth/password-utils.js'

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

  private constructor({ userRepository }: { userRepository: IUserRepository }) {
    this.userRepository = userRepository
  }

  static create({ userRepository }: { userRepository: IUserRepository }): CreateUserUseCase {
    return new CreateUserUseCase({ userRepository })
  }

  async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, DuplicatedError | RepositoryError | ValidationError>> {
    const findResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findResult.ok) {
      return Err(findResult.error)
    }

    const existingUser = findResult.value

    if (existingUser) {
      return Err(
        DuplicatedError.create({
          entityName: 'User',
          identifier: dto.email,
        }),
      )
    }

    const passwordHash = await hashPassword(dto.password)

    const userResult = User.create({
      email: dto.email,
      id: randomUUID(),
      passwordHash,
      role: dto.role,
    })

    if (!userResult.ok) {
      return Err(userResult.error)
    }

    const user = userResult.value

    const savedUser = await this.userRepository.save({ user })

    if (!savedUser.ok) {
      return Err(savedUser.error)
    }

    return Ok(savedUser.value.toDTO())
  }
}
