import type { Team } from '@domain/models/Team.js'
import type { TeamId } from '@team-pulse/shared/domain/ids'
import type { RepositoryError } from '@team-pulse/shared/errors'
import type { Result } from '@team-pulse/shared/result'

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
  findById({ id }: { id: TeamId }): Promise<Result<Team | null, RepositoryError>>

  /**
   * Find all teams
   *
   * @returns Result with array of all teams (empty array if none exist), or RepositoryError if operation fails
   */
  findAll(): Promise<Result<Team[], RepositoryError>>

  /**
   * Find teams with pagination
   *
   * @param page - Page number (1-indexed)
   * @param limit - Number of items per page
   * @returns Result with paginated teams and total count, or RepositoryError if operation fails
   */
  findAllPaginated({
    page,
    limit,
  }: {
    page: number
    limit: number
  }): Promise<Result<{ teams: Team[]; total: number }, RepositoryError>>

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
  delete({ id }: { id: TeamId }): Promise<Result<void, RepositoryError>>

  /**
   * Check if a team exists by name
   *
   * @param name - The team's name
   * @returns Result with boolean indicating if team exists, or RepositoryError if operation fails
   */
  existsByName({ name }: { name: string }): Promise<Result<boolean, RepositoryError>>
}
