import type { CreateUserDTO, UserResponseDTO } from '@team-pulse/shared/dtos'
import { User } from '../../domain/entities'
import { DomainError, NotFoundError, ValidationError } from '../../domain/errors'
import type { CreateUserData, IUserRepository } from '../../domain/repositories'
import type { Result } from '../../domain/types/Result'
import { Err, Ok } from '../../domain/types/Result'
import type { ApiClient } from '../api/api-client'
import { ApiError } from '../api/api-client'

/**
 * API User Repository Implementation
 * Adapts ApiClient to IUserRepository interface
 * Note: We don't have a dedicated UserApiClient yet, so we use ApiClient directly
 */
export class ApiUserRepository implements IUserRepository {
  constructor(private readonly apiClient: ApiClient) {}

  /**
   * Find user by ID
   * Returns [error, null] or [null, user] or [null, null] if not found
   */
  async findById(id: string): Promise<Result<User | null, DomainError>> {
    try {
      const userDTO = await this.apiClient.get<UserResponseDTO>(`/api/users/${id}`)

      // Map user DTO to domain entity
      const [error, user] = User.fromDTO(userDTO)
      if (error) {
        return Err(error)
      }

      return Ok(user)
    } catch (error) {
      // If not found, return null instead of error
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        return Ok(null)
      }

      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Find user by email
   * Returns [error, null] or [null, user] or [null, null] if not found
   */
  async findByEmail(email: string): Promise<Result<User | null, DomainError>> {
    try {
      // Get all users and filter by email
      const users = await this.apiClient.get<UserResponseDTO[]>('/api/users')

      const userDTO = users.find((u) => u.email === email)

      if (!userDTO) {
        return Ok(null)
      }

      // Map user DTO to domain entity
      const [error, user] = User.fromDTO(userDTO)
      if (error) {
        return Err(error)
      }

      return Ok(user)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Get all users
   * Returns [error, null] or [null, users[]]
   */
  async findAll(): Promise<Result<User[], DomainError>> {
    try {
      const userDTOs = await this.apiClient.get<UserResponseDTO[]>('/api/users')

      // Map user DTOs to domain entities
      const [error, users] = User.fromDTOList(userDTOs)
      if (error) {
        return Err(error)
      }

      return Ok(users)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Create new user
   * Returns [error, null] or [null, user]
   */
  async create(data: CreateUserData): Promise<Result<User, DomainError>> {
    try {
      const createDTO: CreateUserDTO = {
        email: data.email,
        password: data.password,
        role: data.role as 'SUPER_ADMIN' | 'ADMIN' | 'USER',
      }

      const userDTO = await this.apiClient.post<UserResponseDTO>('/api/users', createDTO)

      // Map user DTO to domain entity
      const [error, user] = User.fromDTO(userDTO)
      if (error) {
        return Err(error)
      }

      return Ok(user)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Count total users
   * Returns [error, null] or [null, count]
   */
  async count(): Promise<Result<number, DomainError>> {
    try {
      const users = await this.apiClient.get<UserResponseDTO[]>('/api/users')

      return Ok(users.length)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Map ApiError to DomainError
   */
  private mapApiErrorToDomain(error: unknown): DomainError {
    if (error instanceof ApiError) {
      // Map to specific domain errors based on error code
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return new ValidationError(error.message, {
            details: error.details,
            field: error.field,
          })

        case 'NOT_FOUND':
          return new NotFoundError(error.message)

        default:
          return new DomainError(error.message, {
            isOperational: error.statusCode < 500,
          })
      }
    }

    // Unknown errors
    if (error instanceof Error) {
      return new DomainError(error.message, { isOperational: false })
    }

    return new DomainError('An unknown error occurred', {
      isOperational: false,
    })
  }
}
