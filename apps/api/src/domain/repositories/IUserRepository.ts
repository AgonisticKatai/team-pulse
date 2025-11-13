import type { RepositoryError } from '../errors/RepositoryError.js'
import type { User } from '../models/User.js'
import type { Result } from '../types/Result.js'

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
   * @returns The user if found, null otherwise
   */
  findById(id: string): Promise<User | null>

  /**
   * Find a user by their email address
   *
   * @param email - The user's email (case-insensitive search)
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Find all users
   *
   * @returns Result with array of all users (empty array if none exist), or RepositoryError if operation fails
   */
  findAll(): Promise<Result<User[], RepositoryError>>

  /**
   * Save a user (create or update)
   *
   * If the user doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param user - The user entity to save
   * @returns The saved user
   */
  save(user: User): Promise<User>

  /**
   * Delete a user by their identifier
   *
   * @param id - The user's unique identifier
   * @returns true if deleted, false if user didn't exist
   */
  delete(id: string): Promise<boolean>

  /**
   * Check if a user exists by email
   *
   * @param email - The user's email
   * @returns true if a user with this email exists
   */
  existsByEmail(email: string): Promise<boolean>

  /**
   * Count total number of users
   *
   * @returns Total count of users
   */
  count(): Promise<number>
}
