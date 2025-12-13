import { User } from '@domain/models/user/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { Database } from '@infrastructure/database/connection.js'
import { users as usersSchema } from '@infrastructure/database/schema.js'
import type { ValidationError } from '@team-pulse/shared'
import { collect, Err, IdUtils, Ok, RepositoryError, type Result, type UserId } from '@team-pulse/shared'
import { eq, sql } from 'drizzle-orm'

/**
 * Drizzle User Repository (ADAPTER)
 * Implements strict typing mapping between DB (strings) and Domain (Branded Types).
 */
export class DrizzleUserRepository implements IUserRepository {
  private readonly db: Database

  private constructor({ db }: { db: Database }) {
    this.db = db
  }

  static create({ db }: { db: Database }): DrizzleUserRepository {
    return new DrizzleUserRepository({ db })
  }

  // Accepts strict UserId
  async findById({ id }: { id: UserId }): Promise<Result<User | null, RepositoryError>> {
    try {
      const [user] = await this.db.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1)

      if (!user) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ user })

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
      // Case-insensitive email search
      const [user] = await this.db
        .select()
        .from(usersSchema)
        .where(sql`LOWER(${usersSchema.email}) = LOWER(${email})`)
        .limit(1)

      if (!user) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ user })

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
      const rows = await this.db.select().from(usersSchema)

      const mappedResults = rows.map((user: typeof usersSchema.$inferSelect) => this.mapToDomain({ user }))

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

      const [rows, totalResult] = await Promise.all([
        this.db.select().from(usersSchema).limit(limit).offset(offset),
        this.db.select({ count: sql<number>`count(*)` }).from(usersSchema),
      ])

      const total = Number(totalResult[0]?.count ?? 0)

      const mappedResults = rows.map((user: typeof usersSchema.$inferSelect) => this.mapToDomain({ user }))

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
      const obj = user.toObject()

      // Drizzle handles object mapping implicit as UserId extends string
      const row = {
        createdAt: obj.createdAt,
        email: obj.email,
        id: obj.id,
        passwordHash: user.getPasswordHash(),
        role: obj.role,
        updatedAt: obj.updatedAt,
      }

      await this.db
        .insert(usersSchema)
        .values(row)
        .onConflictDoUpdate({
          set: {
            email: row.email,
            passwordHash: row.passwordHash,
            role: row.role,
            updatedAt: row.updatedAt,
          },
          target: usersSchema.id,
        })

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

  // Accepts strict UserId
  async delete({ id }: { id: UserId }): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db.delete(usersSchema).where(eq(usersSchema.id, id))
      return Ok(result.count > 0)
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
      const rows = await this.db
        .select({ id: usersSchema.id })
        .from(usersSchema)
        .where(sql`LOWER(${usersSchema.email}) = LOWER(${email})`)
        .limit(1)

      return Ok(rows.length > 0)
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
      const result = await this.db.select({ count: sql<number>`count(*)` }).from(usersSchema)
      return Ok(Number(result[0]?.count ?? 0))
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
   * Explicit hydration of UserId
   */
  private mapToDomain({ user }: { user: typeof usersSchema.$inferSelect }): Result<User, ValidationError> {
    return User.create({
      createdAt: new Date(user.createdAt),
      email: user.email,
      id: IdUtils.toId<UserId>(user.id),
      passwordHash: user.passwordHash,
      role: user.role,
      updatedAt: new Date(user.updatedAt),
    })
  }
}
