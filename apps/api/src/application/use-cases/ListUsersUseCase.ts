import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { UserResponseDTO, UsersListResponseDTO } from '../dtos/AuthDTO.js'

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
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UsersListResponseDTO> {
    // Fetch all users
    const users = await this.userRepository.findAll()

    // Map to response DTOs
    const userDTOs = users.map((user): UserResponseDTO => {
      const obj = user.toObject()
      return {
        id: obj.id,
        email: obj.email,
        role: obj.role,
        createdAt: obj.createdAt.toISOString(),
        updatedAt: obj.updatedAt.toISOString(),
      }
    })

    return {
      users: userDTOs,
      total: userDTOs.length,
    }
  }
}
