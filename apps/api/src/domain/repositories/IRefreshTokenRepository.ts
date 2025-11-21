import type { RepositoryError } from '@domain/errors/RepositoryError.js'
import type { RefreshToken } from '@domain/models/RefreshToken.js'
import type { Result } from '@team-pulse/shared/result'

/**
 * RefreshToken Repository Interface (PORT)
 *
 * This is a PORT in Hexagonal Architecture:
 * - Defined in the DOMAIN layer
 * - Implemented in the INFRASTRUCTURE layer
 * - Describes WHAT operations are needed, not HOW they're implemented
 *
 * Benefits:
 * - Domain layer doesn't depend on database technology
 * - Easy to swap implementations (Drizzle → Prisma → TypeORM)
 * - Easy to mock for testing
 * - Follows Dependency Inversion Principle (SOLID)
 *
 * The domain defines the contract, infrastructure implements it.
 */
export interface IRefreshTokenRepository {
  /**
   * Find a refresh token by the token string
   *
   * @param token - The refresh token string
   * @returns The refresh token if found, null otherwise, or RepositoryError if operation fails
   */
  findByToken({ token }: { token: string }): Promise<Result<RefreshToken | null, RepositoryError>>

  /**
   * Find all refresh tokens for a specific user
   *
   * @param userId - The user's unique identifier
   * @returns Array of refresh tokens for the user (empty array if none exist), or RepositoryError if operation fails
   */
  findByUserId({ userId }: { userId: string }): Promise<Result<RefreshToken[], RepositoryError>>

  /**
   * Save a refresh token (create or update)
   *
   * If the token doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param refreshToken - The refresh token entity to save
   * @returns The saved refresh token, or RepositoryError if operation fails
   */
  save({ refreshToken }: { refreshToken: RefreshToken }): Promise<Result<RefreshToken, RepositoryError>>

  /**
   * Delete a refresh token by the token string
   *
   * @param token - The refresh token string
   * @returns true if deleted, false if token didn't exist, or RepositoryError if operation fails
   */
  deleteByToken({ token }: { token: string }): Promise<Result<boolean, RepositoryError>>

  /**
   * Delete all refresh tokens for a specific user
   *
   * Useful for logout-all-devices functionality
   *
   * @param userId - The user's unique identifier
   * @returns Number of tokens deleted, or RepositoryError if operation fails
   */
  deleteByUserId({ userId }: { userId: string }): Promise<Result<number, RepositoryError>>

  /**
   * Delete all expired refresh tokens
   *
   * Useful for cleanup jobs
   *
   * @returns Number of tokens deleted, or RepositoryError if operation fails
   */
  deleteExpired(): Promise<Result<number, RepositoryError>>
}
