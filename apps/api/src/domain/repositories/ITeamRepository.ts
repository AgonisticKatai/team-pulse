import type { RepositoryError } from '../errors/index.js'
import type { Team } from '../models/Team.js'
import type { Result } from '../types/index.js'

/**
 * Team Repository Interface (PORT)
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
 *
 * IMPORTANT: All methods return Result<T, RepositoryError> for explicit error handling.
 * No exceptions should be thrown from repository operations.
 */
export interface ITeamRepository {
  /**
   * Find a team by its unique identifier
   *
   * @param id - The team's unique identifier
   * @returns Result with the team if found (null if not found), or RepositoryError if operation fails
   */
  findById({ id }: { id: string }): Promise<Result<Team | null, RepositoryError>>

  /**
   * Find all teams
   *
   * @returns Result with array of all teams (empty array if none exist), or RepositoryError if operation fails
   */
  findAll(): Promise<Result<Team[], RepositoryError>>

  /**
   * Find a team by name
   *
   * @param name - The team's name (case-insensitive search)
   * @returns Result with the team if found (null if not found), or RepositoryError if operation fails
   */
  findByName({ name }: { name: string }): Promise<Result<Team | null, RepositoryError>>

  /**
   * Save a team (create or update)
   *
   * If the team doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param team - The team entity to save
   * @returns Result with the saved team, or RepositoryError if operation fails
   */
  save({ team }: { team: Team }): Promise<Result<Team, RepositoryError>>

  /**
   * Delete a team by its identifier
   *
   * @param id - The team's unique identifier
   * @returns Result with void if deleted successfully, or RepositoryError if operation fails
   */
  delete({ id }: { id: string }): Promise<Result<void, RepositoryError>>

  /**
   * Check if a team exists by name
   *
   * @param name - The team's name
   * @returns Result with boolean indicating if team exists, or RepositoryError if operation fails
   */
  existsByName({ name }: { name: string }): Promise<Result<boolean, RepositoryError>>
}
