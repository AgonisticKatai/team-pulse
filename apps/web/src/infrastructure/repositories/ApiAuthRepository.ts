import { User } from '../../domain/entities'
import { DomainError, NotFoundError, ValidationError } from '../../domain/errors'
import type { IAuthRepository, LoginCredentials, LoginResponse } from '../../domain/repositories'
import type { Result } from '../../domain/types/Result'
import { Err, Ok } from '../../domain/types/Result'
import { ApiError } from '../api/apiClient'
import type { AuthApiClient } from '../api/authApiClient'

/**
 * API Auth Repository Implementation
 * Adapts AuthApiClient to IAuthRepository interface
 * Converts API responses to domain entities and handles errors
 */
export class ApiAuthRepository implements IAuthRepository {
  constructor(private readonly authApiClient: AuthApiClient) {}

  /**
   * Login with email and password
   * Returns [error, null] or [null, loginResponse]
   */
  async login(credentials: LoginCredentials): Promise<Result<LoginResponse, DomainError>> {
    try {
      const response = await this.authApiClient.login({
        email: credentials.email,
        password: credentials.password,
      })

      // Map user DTO to domain entity
      const [userError, user] = User.fromDTO(response.user)
      if (userError) {
        return Err(userError)
      }

      return Ok({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user,
      })
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Logout current user
   * Returns [error, null] or [null, true]
   */
  async logout(): Promise<Result<true, DomainError>> {
    try {
      // Get refresh token from storage (we'll implement this later)
      const refreshToken = localStorage.getItem('team_pulse_refresh_token') ?? ''

      await this.authApiClient.logout({ refreshToken })

      return Ok(true)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Refresh access token using refresh token
   * Returns [error, null] or [null, { accessToken }]
   */
  async refreshToken(refreshToken: string): Promise<Result<{ accessToken: string }, DomainError>> {
    try {
      const response = await this.authApiClient.refreshToken({ refreshToken })

      return Ok({ accessToken: response.accessToken })
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Get current authenticated user
   * Returns [error, null] or [null, user]
   */
  async getCurrentUser(): Promise<Result<User, DomainError>> {
    try {
      const userDTO = await this.authApiClient.getCurrentUser()

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

        case 'UNAUTHORIZED':
        case 'INVALID_CREDENTIALS':
          return new ValidationError('Invalid email or password')

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
