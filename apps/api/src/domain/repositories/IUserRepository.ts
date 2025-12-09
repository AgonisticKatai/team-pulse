import type { User } from '@domain/models/User.js'
import type { RepositoryError, Result, UserId } from '@team-pulse/shared'

/**
 * User Repository Interface (PORT)
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
export interface IUserRepository {
  /**
   * Find a user by their unique identifier
   *
   * @param id - The user's unique identifier
   * @returns The user if found, null otherwise, or RepositoryError if operation fails
   */
  findById({ id }: { id: UserId }): Promise<Result<User | null, RepositoryError>>

  /**
   * Find a user by their email address
   *
   * @param email - The user's email (case-insensitive search)
   * @returns Result with the user if found (null if not found), or RepositoryError if operation fails
   */
  findByEmail({ email }: { email: string }): Promise<Result<User | null, RepositoryError>>

  /**
   * Find all users
   *
   * @returns Result with array of all users (empty array if none exist), or RepositoryError if operation fails
   */
  findAll(): Promise<Result<User[], RepositoryError>>

  /**
   * Find users with pagination
   *
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @returns Result with paginated users and total count, or RepositoryError if operation fails
   */
  findAllPaginated({
    page,
    limit,
  }: {
    page: number
    limit: number
  }): Promise<Result<{ users: User[]; total: number }, RepositoryError>>

  /**
   * Save a user (create or update)
   *
   * If the user doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param user - The user entity to save
   * @returns Result with the saved user, or RepositoryError if operation fails
   */
  save({ user }: { user: User }): Promise<Result<User, RepositoryError>>

  /**
   * Delete a user by their identifier
   *
   * @param id - The user's unique identifier
   * @returns true if deleted, false if user didn't exist, or RepositoryError if operation fails
   */
  delete({ id }: { id: UserId }): Promise<Result<boolean, RepositoryError>>

  /**
   * Check if a user exists by email
   *
   * @param email - The user's email
   * @returns true if a user with this email exists, or RepositoryError if operation fails
   */
  existsByEmail({ email }: { email: string }): Promise<Result<boolean, RepositoryError>>

  /**
   * Count total number of users
   *
   * @returns Total count of users, or RepositoryError if operation fails
   */
  count(): Promise<Result<number, RepositoryError>>
}
