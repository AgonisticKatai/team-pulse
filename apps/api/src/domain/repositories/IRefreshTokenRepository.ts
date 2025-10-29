import type { RefreshToken } from '../models/RefreshToken.js'

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
   * @returns The refresh token if found, null otherwise
   */
  findByToken(token: string): Promise<RefreshToken | null>

  /**
   * Find all refresh tokens for a specific user
   *
   * @param userId - The user's unique identifier
   * @returns Array of refresh tokens for the user (empty array if none exist)
   */
  findByUserId(userId: string): Promise<RefreshToken[]>

  /**
   * Save a refresh token (create or update)
   *
   * If the token doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param refreshToken - The refresh token entity to save
   * @returns The saved refresh token
   */
  save(refreshToken: RefreshToken): Promise<RefreshToken>

  /**
   * Delete a refresh token by the token string
   *
   * @param token - The refresh token string
   * @returns true if deleted, false if token didn't exist
   */
  deleteByToken(token: string): Promise<boolean>

  /**
   * Delete all refresh tokens for a specific user
   *
   * Useful for logout-all-devices functionality
   *
   * @param userId - The user's unique identifier
   * @returns Number of tokens deleted
   */
  deleteByUserId(userId: string): Promise<number>

  /**
   * Delete all expired refresh tokens
   *
   * Useful for cleanup jobs
   *
   * @returns Number of tokens deleted
   */
  deleteExpired(): Promise<number>
}
