import { eq } from 'drizzle-orm'
import { Team } from '../../../domain/models/Team.js'
import type { ITeamRepository } from '../../../domain/repositories/ITeamRepository.js'
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
 *
 * Note: Uses type assertions for database operations because Database type is a union
 * of SQLite and PostgreSQL instances, both supporting the same query builder interface.
 */
export class DrizzleTeamRepository implements ITeamRepository {
  constructor(private readonly db: Database) {}

  /**
   * Type-safe database access
   * Both SQLite and PostgreSQL drizzle instances support the same query builder interface
   */
  private get query() {
    // biome-ignore lint/suspicious/noExplicitAny: Union type requires type assertion for query builder
    return this.db as any
  }

  async findById(id: string): Promise<Team | null> {
    const rows = await this.query.select().from(teams).where(eq(teams.id, id)).limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return this.mapToDomain(row)
  }

  async findAll(): Promise<Team[]> {
    const rows = await this.query.select().from(teams)

    return rows.map((row: typeof teams.$inferSelect) => this.mapToDomain(row))
  }

  async findByName(name: string): Promise<Team | null> {
    // Case-insensitive search using SQL LOWER
    const rows = await this.query.select().from(teams).where(eq(teams.name, name)).limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return this.mapToDomain(row)
  }

  async save(team: Team): Promise<Team> {
    const obj = team.toObject()

    // Convert to database format
    // Drizzle with mode: 'timestamp' handles Date <-> timestamp conversion automatically
    const row = {
      id: obj.id,
      name: obj.name,
      city: obj.city,
      foundedYear: obj.foundedYear,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }

    // Upsert: insert or update if exists
    await this.query
      .insert(teams)
      .values(row)
      .onConflictDoUpdate({
        target: teams.id,
        set: {
          name: row.name,
          city: row.city,
          foundedYear: row.foundedYear,
          updatedAt: row.updatedAt,
        },
      })

    return team
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.query.delete(teams).where(eq(teams.id, id))

    // Drizzle returns { changes: number } for SQLite, count for PostgreSQL
    const typedResult = result as { changes?: number; count?: number }
    const deleteCount = typedResult.changes ?? typedResult.count ?? 0
    return deleteCount > 0
  }

  async existsByName(name: string): Promise<boolean> {
    const rows = await this.query
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.name, name))
      .limit(1)

    return rows.length > 0
  }

  /**
   * Map database row to domain entity
   *
   * This is where we convert infrastructure data structures
   * to domain entities. The domain entity validates itself.
   */
  private mapToDomain(row: typeof teams.$inferSelect): Team {
    return Team.fromPersistence({
      id: row.id,
      name: row.name,
      city: row.city,
      foundedYear: row.foundedYear,
      createdAt: new Date(row.createdAt), // Convert from timestamp
      updatedAt: new Date(row.updatedAt), // Convert from timestamp
    })
  }
}
