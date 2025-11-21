import { RepositoryError } from '@domain/errors/RepositoryError.js'
import type { ValidationError } from '@domain/errors/ValidationError.js'
import { Team } from '@domain/models/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { Database } from '@infrastructure/database/connection.js'
import { teams as teamsSchema } from '@infrastructure/database/schema.js'
import { collect, Err, Ok, type Result } from '@team-pulse/shared/result'
import { eq, sql } from 'drizzle-orm'

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
  private readonly db: Database

  private constructor({ db }: { db: Database }) {
    this.db = db
  }

  static create({ db }: { db: Database }): DrizzleTeamRepository {
    return new DrizzleTeamRepository({ db })
  }

  async findById({ id }: { id: string }): Promise<Result<Team | null, RepositoryError>> {
    try {
      const [team] = await this.db.select().from(teamsSchema).where(eq(teamsSchema.id, id)).limit(1)

      if (!team) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ team })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map team to domain',
            operation: 'findById',
          }),
        )
      }

      return Ok(domainResult.value)
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
      const teams = await this.db.select().from(teamsSchema)

      const mappedResults = teams.map((team: typeof teamsSchema.$inferSelect) => this.mapToDomain({ team }))

      const collectedResult = collect(mappedResults)

      if (!collectedResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: collectedResult.error,
            message: 'Failed to map team to domain',
            operation: 'findAll',
          }),
        )
      }

      return Ok(collectedResult.value)
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

  async findAllPaginated({ page, limit }: { page: number; limit: number }): Promise<Result<{ teams: Team[]; total: number }, RepositoryError>> {
    try {
      const offset = (page - 1) * limit

      // Execute both queries in parallel
      const [teams, totalResult] = await Promise.all([
        this.db.select().from(teamsSchema).limit(limit).offset(offset),
        this.db.select({ count: sql<number>`count(*)` }).from(teamsSchema),
      ])

      const total = Number(totalResult[0]?.count ?? 0)

      const mappedResults = teams.map((team: typeof teamsSchema.$inferSelect) => this.mapToDomain({ team }))

      const collectedResult = collect(mappedResults)

      if (!collectedResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: collectedResult.error,
            message: 'Failed to map team to domain',
            operation: 'findAllPaginated',
          }),
        )
      }

      return Ok({ teams: collectedResult.value, total })
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find paginated teams',
          operation: 'findAllPaginated',
        }),
      )
    }
  }

  async findByName({ name }: { name: string }): Promise<Result<Team | null, RepositoryError>> {
    try {
      const [team] = await this.db.select().from(teamsSchema).where(eq(teamsSchema.name, name)).limit(1)

      if (!team) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ team })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map team to domain',
            operation: 'findByName',
          }),
        )
      }

      return Ok(domainResult.value)
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

  async save({ team }: { team: Team }): Promise<Result<Team, RepositoryError>> {
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
        .insert(teamsSchema)
        .values(row)
        .onConflictDoUpdate({
          set: {
            city: row.city,
            foundedYear: row.foundedYear,
            name: row.name,
            updatedAt: row.updatedAt,
          },
          target: teamsSchema.id,
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
      await this.db.delete(teamsSchema).where(eq(teamsSchema.id, id))
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

  async existsByName({ name }: { name: string }): Promise<Result<boolean, RepositoryError>> {
    try {
      const teams = await this.db.select({ id: teamsSchema.id }).from(teamsSchema).where(eq(teamsSchema.name, name)).limit(1)

      return Ok(teams.length > 0)
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
   *
   * Returns Result to maintain consistency with the Result pattern.
   * If mapping fails (should never happen with valid DB data),
   * the error is propagated through Result.
   */
  private mapToDomain({ team }: { team: typeof teamsSchema.$inferSelect }): Result<Team, ValidationError> {
    return Team.create({
      city: team.city,
      createdAt: new Date(team.createdAt), // Convert from timestamp
      foundedYear: team.foundedYear,
      id: team.id,
      name: team.name,
      updatedAt: new Date(team.updatedAt), // Convert from timestamp
    })
  }
}
