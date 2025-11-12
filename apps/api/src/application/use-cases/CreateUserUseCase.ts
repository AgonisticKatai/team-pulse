import { randomUUID } from 'node:crypto'
import type { CreateUserDTO, UserResponseDTO } from '@team-pulse/shared'
import { ValidationError } from '../../domain/errors/index.js'
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

  async execute(dto: CreateUserDTO): Promise<Result<UserResponseDTO, ValidationError>> {
    // Business Rule: Email must be unique
    const existingUser = await this.userRepository.findByEmail(dto.email)

    if (existingUser) {
      return Err(
        ValidationError.forField({
          field: 'email',
          message: `A user with email "${dto.email}" already exists`,
        }),
      )
    }

    // Hash the password before storing
    const passwordHash = await hashPassword(dto.password)

    // Create domain entity
    // The User entity validates its own invariants
    const userResult = User.create({
      email: dto.email,
      id: randomUUID(),
      passwordHash,
      role: dto.role,
    })

    if (!userResult.ok) {
      return Err(userResult.error)
    }

    // Persist
    const savedUser = await this.userRepository.save(userResult.value)

    // Map to response DTO (WITHOUT password hash)
    return Ok(this.mapToResponseDTO(savedUser))
  }

  /**
   * Map domain entity to response DTO
   *
   * IMPORTANT: Does NOT include password hash for security
   */
  private mapToResponseDTO(user: User): UserResponseDTO {
    return user.toDTO()
  }
}
