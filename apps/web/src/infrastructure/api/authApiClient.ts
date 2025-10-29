/**
 * Auth API Client (Infrastructure Layer)
 *
 * Handles all authentication-related API calls:
 * - Login
 * - Logout
 * - Token refresh
 * - Get current user
 *
 * This client interacts with the backend auth endpoints
 * and transforms responses to application-layer types.
 */

import type {
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
  UserResponseDTO,
} from '@team-pulse/shared'
import type { ApiClient } from './apiClient'

/**
 * Auth API Client
 */
export class AuthApiClient {
  constructor(private readonly apiClient: ApiClient) {}

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    return this.apiClient.post<LoginResponseDTO>('/api/auth/login', credentials)
  }

  /**
   * Logout and invalidate refresh token
   */
  async logout(request: LogoutRequestDTO): Promise<void> {
    return this.apiClient.post<void>('/api/auth/logout', request)
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequestDTO): Promise<RefreshTokenResponseDTO> {
    return this.apiClient.post<RefreshTokenResponseDTO>('/api/auth/refresh', request)
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponseDTO> {
    return this.apiClient.get<UserResponseDTO>('/api/auth/me')
  }
}

/**
 * Factory function to create AuthApiClient
 */
export function createAuthApiClient(apiClient: ApiClient): AuthApiClient {
  return new AuthApiClient(apiClient)
}
