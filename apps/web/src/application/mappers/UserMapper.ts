import type { UserResponseDTO } from '@team-pulse/shared'
import { User } from '../../domain/entities'
import { ValidationError } from '../../domain/errors'
import type { Result } from '../../domain/types/Result'
import { Err } from '../../domain/types/Result'

/**
 * User Mapper
 * Converts between DTOs and Domain Entities
 */

/**
 * Map DTO to Domain Entity
 * Returns [error, null] or [null, user]
 */
export function userToDomain(dto: UserResponseDTO): Result<User, ValidationError> {
  const [error, user] = User.create({
    createdAt: dto.createdAt,
    email: dto.email,
    id: dto.id,
    role: dto.role,
    updatedAt: dto.updatedAt,
  })

  if (error) {
    return Err(
      new ValidationError(`Failed to map User DTO to domain: ${error.message}`, {
        details: { dto, originalError: error.toObject() },
      }),
    )
  }

  return [null, user]
}

/**
 * Map array of DTOs to array of Domain Entities
 * Returns [error, null] or [null, users[]]
 * If any DTO fails to map, returns error for the first failure
 */
export function userToDomainList(dtos: UserResponseDTO[]): Result<User[], ValidationError> {
  const users: User[] = []

  for (const dto of dtos) {
    const [error, user] = userToDomain(dto)
    if (error) {
      return Err(error)
    }
    users.push(user)
  }

  return [null, users]
}

/**
 * Map Domain Entity to DTO
 * This is used when we need to send data to the API
 */
export function userToDTO(user: User): UserResponseDTO {
  return {
    createdAt: user.getCreatedAt().toISOString(),
    email: user.getEmail().getValue(),
    id: user.getId().getValue(),
    role: user.getRole().getValue(),
    updatedAt: user.getUpdatedAt().toISOString(),
  }
}

/**
 * Map array of Domain Entities to array of DTOs
 */
export function userToDTOList(users: User[]): UserResponseDTO[] {
  return users.map((user) => userToDTO(user))
}
