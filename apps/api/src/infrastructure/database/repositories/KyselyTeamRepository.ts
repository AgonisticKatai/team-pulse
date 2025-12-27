import { Team } from '@domain/models/team/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { KyselyDB } from '@infrastructure/database/kysely-connection.js'
import { collect, Err, Ok, RepositoryError, type Result, type TeamId, type ValidationError } from '@team-pulse/shared'

/**
 * Kysely Team Repository (ADAPTER)
 *
 * Maps between database layer and domain layer:
 * - DB → Domain: Delegates validation to Team.create()
 * - Domain → DB: Uses Team.toPrimitives() for type-safe persistence
 *
 * All validation logic lives in the domain model, not here.
 */
export class KyselyTeamRepository implements ITeamRepository {
  private readonly db: KyselyDB

  private constructor({ db }: { db: KyselyDB }) {
    this.db = db
  }

  static create({ db }: { db: KyselyDB }): KyselyTeamRepository {
    return new KyselyTeamRepository({ db })
  }

  async findById({ id }: { id: TeamId }): Promise<Result<Team | null, RepositoryError>> {
    try {
      const row = await this.db.selectFrom('teams').selectAll().where('id', '=', id).executeTakeFirst()

      if (!row) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ team: row })

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
      const rows = await this.db.selectFrom('teams').selectAll().execute()

      const mappedResults = rows.map((team) => this.mapToDomain({ team }))
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

  async findAllPaginated({
    page,
    limit,
  }: {
    page: number
    limit: number
  }): Promise<Result<{ teams: Team[]; total: number }, RepositoryError>> {
    try {
      const offset = (page - 1) * limit

      const [rows, countResult] = await Promise.all([
        this.db.selectFrom('teams').selectAll().limit(limit).offset(offset).execute(),
        this.db
          .selectFrom('teams')
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
      ])

      const total = Number(countResult?.count ?? 0)

      const mappedResults = rows.map((team) => this.mapToDomain({ team }))
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
      const row = await this.db.selectFrom('teams').selectAll().where('name', '=', name).executeTakeFirst()

      if (!row) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ team: row })

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
      const primitives = team.toPrimitives()

      await this.db
        .insertInto('teams')
        .values({
          created_at: primitives.createdAt,
          id: primitives.id,
          name: primitives.name,
          updated_at: primitives.updatedAt,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            name: primitives.name,
            updated_at: primitives.updatedAt,
          }),
        )
        .execute()

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

  async delete({ id }: { id: TeamId }): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.deleteFrom('teams').where('id', '=', id).execute()
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
      const row = await this.db.selectFrom('teams').select('id').where('name', '=', name).executeTakeFirst()

      return Ok(row !== undefined)
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
   * Delegates all validation to Team.create()
   */
  private mapToDomain({ team }: { team: { id: string; name: string; created_at: Date; updated_at: Date } }): Result<Team, ValidationError> {
    return Team.create({
      createdAt: new Date(team.created_at),
      id: team.id,           // String - Team.create() validates
      name: team.name,       // String - Team.create() validates
      updatedAt: new Date(team.updated_at),
    })
  }
}
