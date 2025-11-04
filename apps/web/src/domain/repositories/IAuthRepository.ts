import type { User } from '../entities'
import type { DomainError } from '../errors'
import type { Result } from '../types/Result'

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

/**
 * Auth Repository Interface (PORT)
 * Defines the contract for authentication operations
 */
export interface IAuthRepository {
  /**
   * Login with email and password
   * Returns [error, null] or [null, session]
   */
  login(credentials: LoginCredentials): Promise<Result<LoginResponse, DomainError>>

  /**
   * Logout current user
   * Returns [error, null] or [null, true]
   */
  logout(): Promise<Result<true, DomainError>>

  /**
   * Refresh access token using refresh token
   * Returns [error, null] or [null, { accessToken }]
   */
  refreshToken(refreshToken: string): Promise<Result<{ accessToken: string }, DomainError>>

  /**
   * Get current authenticated user
   * Returns [error, null] or [null, user]
   */
  getCurrentUser(): Promise<Result<User, DomainError>>
}
