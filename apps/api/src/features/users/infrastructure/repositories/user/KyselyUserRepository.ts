import { User } from '@features/users/domain/models/user/User.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import type { User as UserRow } from '@shared/database/schemas/kysely-schema.js'
import { collect, Err, Ok, RepositoryError, type Result, type UserId, type ValidationError } from '@team-pulse/shared'
import { sql } from 'kysely'

/**
 * Kysely User Repository (ADAPTER)
 *
 * Maps between database layer and domain layer:
 * - DB → Domain: Delegates validation to User.create()
 * - Domain → DB: Uses User.toPrimitives() for type-safe persistence
 *
 * All validation logic lives in the domain model, not here.
 *
 * Pure TypeScript, zero DSLs, full type safety.
 */
export class KyselyUserRepository implements IUserRepository {
  private readonly db: Database

  private constructor({ db }: { db: Database }) {
    this.db = db
  }

  static create({ db }: { db: Database }): KyselyUserRepository {
    return new KyselyUserRepository({ db })
  }

  async findById({ id }: { id: UserId }): Promise<Result<User | null, RepositoryError>> {
    try {
      const row = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst()

      if (!row) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ user: row })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map user to domain',
            operation: 'findById',
          }),
        )
      }

      return Ok(domainResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find user by id',
          operation: 'findById',
        }),
      )
    }
  }

  async findByEmail({ email }: { email: string }): Promise<Result<User | null, RepositoryError>> {
    try {
      // Case-insensitive email search using SQL
      const row = await this.db
        .selectFrom('users')
        .selectAll()
        .where(sql`LOWER(email)`, '=', email.toLowerCase())
        .executeTakeFirst()

      if (!row) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ user: row })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map user to domain',
            operation: 'findByEmail',
          }),
        )
      }

      return Ok(domainResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find user by email',
          operation: 'findByEmail',
        }),
      )
    }
  }

  async findAll(): Promise<Result<User[], RepositoryError>> {
    try {
      const rows = await this.db.selectFrom('users').selectAll().execute()

      const mappedResults = rows.map((user) => this.mapToDomain({ user }))
      const collectedResult = collect(mappedResults)

      if (!collectedResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: collectedResult.error,
            message: 'Failed to map user to domain',
            operation: 'findAll',
          }),
        )
      }

      return Ok(collectedResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find all users',
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
  }): Promise<Result<{ users: User[]; total: number }, RepositoryError>> {
    try {
      const offset = (page - 1) * limit

      // Execute queries in parallel
      const [rows, countResult] = await Promise.all([
        this.db.selectFrom('users').selectAll().limit(limit).offset(offset).execute(),
        this.db
          .selectFrom('users')
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
      ])

      const total = Number(countResult?.count ?? 0)

      const mappedResults = rows.map((user) => this.mapToDomain({ user }))
      const collectedResult = collect(mappedResults)

      if (!collectedResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: collectedResult.error,
            message: 'Failed to map user to domain',
            operation: 'findAllPaginated',
          }),
        )
      }

      return Ok({ total, users: collectedResult.value })
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find paginated users',
          operation: 'findAllPaginated',
        }),
      )
    }
  }

  async save({ user }: { user: User }): Promise<Result<User, RepositoryError>> {
    try {
      const primitives = user.toPrimitives()

      // Map domain primitives to database row
      // Kysely provides full type safety here
      await this.db
        .insertInto('users')
        .values({
          created_at: primitives.createdAt,
          email: primitives.email,
          id: primitives.id,
          password_hash: user.getPasswordHash(),
          role: primitives.role,
          updated_at: primitives.updatedAt,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            email: primitives.email,
            password_hash: user.getPasswordHash(),
            role: primitives.role,
            updated_at: primitives.updatedAt,
          }),
        )
        .execute()

      return Ok(user)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to save user',
          operation: 'save',
        }),
      )
    }
  }

  async delete({ id }: { id: UserId }): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db.deleteFrom('users').where('id', '=', id).executeTakeFirst()
      return Ok(Number(result.numDeletedRows) > 0)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to delete user',
          operation: 'delete',
        }),
      )
    }
  }

  async existsByEmail({ email }: { email: string }): Promise<Result<boolean, RepositoryError>> {
    try {
      const row = await this.db
        .selectFrom('users')
        .select('id')
        .where(sql`LOWER(email)`, '=', email.toLowerCase())
        .executeTakeFirst()

      return Ok(row !== undefined)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to check if user exists by email',
          operation: 'existsByEmail',
        }),
      )
    }
  }

  async count(): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db
        .selectFrom('users')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirst()

      return Ok(Number(result?.count ?? 0))
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to count users',
          operation: 'count',
        }),
      )
    }
  }

  /**
   * Map database row to domain entity
   * Delegates all validation to User.create()
   */
  private mapToDomain({ user }: { user: UserRow }): Result<User, ValidationError> {
    return User.create({
      createdAt: new Date(user.created_at),
      email: user.email,
      id: user.id,
      passwordHash: user.password_hash,
      role: user.role,
      updatedAt: new Date(user.updated_at),
    })
  }
}
