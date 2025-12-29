import type { LoginResponseDTO, RefreshTokenResponseDTO, Result } from '@team-pulse/shared'

/**
 * Auth Repository Port (Hexagonal Architecture)
 *
 * Defines the contract for authentication operations.
 * Application layer depends on this interface, not implementations.
 *
 * Benefits:
 * - Testable: Easy to mock in tests
 * - Swappable: Can change implementation (API, local storage, mock) without affecting use cases
 * - Decoupled: Domain logic doesn't depend on infrastructure details
 */
export interface IAuthRepository {
  /**
   * Authenticate user with email and password
   * Returns auth tokens and user data on success
   */
  login(params: { email: string; password: string }): Promise<Result<LoginResponseDTO, Error>>

  /**
   * End user session
   * Invalidates current tokens
   */
  logout(): Promise<Result<void, Error>>

  /**
   * Refresh access token using refresh token
   * Returns new auth tokens
   */
  refreshToken(params: { refreshToken: string }): Promise<Result<RefreshTokenResponseDTO, Error>>

  /**
   * Verify if current session is valid
   * Returns true if user is authenticated
   */
  verifySession(): Promise<Result<boolean, Error>>
}
