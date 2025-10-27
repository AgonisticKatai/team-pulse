import type { Team } from '../models/Team.js'

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
 */
export interface ITeamRepository {
  /**
   * Find a team by its unique identifier
   *
   * @param id - The team's unique identifier
   * @returns The team if found, null otherwise
   */
  findById(id: string): Promise<Team | null>

  /**
   * Find all teams
   *
   * @returns Array of all teams (empty array if none exist)
   */
  findAll(): Promise<Team[]>

  /**
   * Find a team by name
   *
   * @param name - The team's name (case-insensitive search)
   * @returns The team if found, null otherwise
   */
  findByName(name: string): Promise<Team | null>

  /**
   * Save a team (create or update)
   *
   * If the team doesn't exist, it will be created.
   * If it exists, it will be updated.
   *
   * @param team - The team entity to save
   * @returns The saved team
   */
  save(team: Team): Promise<Team>

  /**
   * Delete a team by its identifier
   *
   * @param id - The team's unique identifier
   * @returns true if deleted, false if team didn't exist
   */
  delete(id: string): Promise<boolean>

  /**
   * Check if a team exists by name
   *
   * @param name - The team's name
   * @returns true if a team with this name exists
   */
  existsByName(name: string): Promise<boolean>
}
