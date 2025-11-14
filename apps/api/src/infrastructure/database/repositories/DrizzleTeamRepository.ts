import { eq } from 'drizzle-orm'
import { RepositoryError } from '../../../domain/errors/index.js'
import { Team } from '../../../domain/models/Team.js'
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../../domain/types/index.js'
import type { Database } from '../connection.js'
import { teams } from '../schema.js'

/**
 * Drizzle Team Repository (ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the ITeamRepository PORT (defined in domain)
 * - Uses Drizzle ORM for database operations
 * - Maps between domain entities (Team) and database rows (TeamRow)
 * - Contains NO business logic (only persistence logic)
 *
 * Benefits of this pattern:
 * 1. Domain layer doesn't know about Drizzle
 * 2. Can swap Drizzle for another ORM without touching domain/application
 * 3. Easy to test domain/application with mock repositories
 * 4. Clear separation between business logic and data access
 *
 * This class is FRAMEWORK-SPECIFIC (knows about Drizzle)
 * but implements a FRAMEWORK-AGNOSTIC interface.
 */
export class DrizzleTeamRepository implements ITeamRepository {
  constructor(private readonly db: Database) {}

  async findById({ id }: { id: string }): Promise<Result<Team | null, RepositoryError>> {
    try {
      const [team] = await this.db.select().from(teams).where(eq(teams.id, id)).limit(1)

      if (!team) {
        return Ok(null)
      }

      return Ok(this.mapToDomain(team))
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find team by id',
          operation: 'findById',
        }),
      )
    }
  }

  async findAll(): Promise<Result<Team[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(teams)

      return Ok(rows.map((row: typeof teams.$inferSelect) => this.mapToDomain(row)))
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find all teams',
          operation: 'findAll',
        }),
      )
    }
  }

  async findByName({ name }: { name: string }): Promise<Result<Team | null, RepositoryError>> {
    try {
      const [team] = await this.db.select().from(teams).where(eq(teams.name, name)).limit(1)

      if (!team) {
        return Ok(null)
      }

      return Ok(this.mapToDomain(team))
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find team by name',
          operation: 'findByName',
        }),
      )
    }
  }

  async save(team: Team): Promise<Result<Team, RepositoryError>> {
    try {
      const obj = team.toObject()

      // Convert to database format
      // Drizzle with mode: 'timestamp' handles Date <-> timestamp conversion automatically
      const row = {
        city: obj.city,
        createdAt: obj.createdAt,
        foundedYear: obj.foundedYear,
        id: obj.id,
        name: obj.name,
        updatedAt: obj.updatedAt,
      }

      // Upsert: insert or update if exists
      await this.db
        .insert(teams)
        .values(row)
        .onConflictDoUpdate({
          set: {
            city: row.city,
            foundedYear: row.foundedYear,
            name: row.name,
            updatedAt: row.updatedAt,
          },
          target: teams.id,
        })

      return Ok(team)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to save team',
          operation: 'save',
        }),
      )
    }
  }

  async delete({ id }: { id: string }): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(teams).where(eq(teams.id, id))
      return Ok(undefined)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to delete team',
          operation: 'delete',
        }),
      )
    }
  }

  async existsByName(name: string): Promise<Result<boolean, RepositoryError>> {
    try {
      const rows = await this.db.select({ id: teams.id }).from(teams).where(eq(teams.name, name)).limit(1)

      return Ok(rows.length > 0)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to check if team exists by name',
          operation: 'existsByName',
        }),
      )
    }
  }

  /**
   * Map database row to domain entity
   *
   * This is where we convert infrastructure data structures
   * to domain entities. The domain entity validates itself.
   */
  private mapToDomain(row: typeof teams.$inferSelect): Team {
    const result = Team.create({
      city: row.city,
      createdAt: new Date(row.createdAt), // Convert from timestamp
      foundedYear: row.foundedYear,
      id: row.id,
      name: row.name,
      updatedAt: new Date(row.updatedAt), // Convert from timestamp
    })

    if (!result.ok) {
      // This should never happen with data from the database
      // since it was validated on creation
      throw result.error
    }

    return result.value
  }
}
