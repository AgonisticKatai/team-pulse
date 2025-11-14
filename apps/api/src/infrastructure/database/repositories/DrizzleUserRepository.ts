import type { UserRole } from '@team-pulse/shared'
import { eq, sql } from 'drizzle-orm'
import { RepositoryError } from '../../../domain/errors/RepositoryError.js'
import { User } from '../../../domain/models/User.js'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../../domain/types/Result.js'
import type { Database } from '../connection.js'
import { users as usersSchema } from '../schema.js'

/**
 * Drizzle User Repository (ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the IUserRepository PORT (defined in domain)
 * - Uses Drizzle ORM for database operations
 * - Maps between domain entities (User) and database rows (UserRow)
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
export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async findById({ id }: { id: string }): Promise<Result<User | null, RepositoryError>> {
    try {
      const [user] = await this.db.select().from(usersSchema).where(eq(usersSchema.id, id)).limit(1)

      if (!user) {
        return Ok(null)
      }

      return Ok(this.mapToDomain({ user }))
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
      // Case-insensitive email search using SQL LOWER
      const [user] = await this.db.select().from(usersSchema).where(sql`LOWER(${usersSchema.email}) = LOWER(${email})`).limit(1)

      if (!user) {
        return Ok(null)
      }

      return Ok(this.mapToDomain({ user }))
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

      return Ok(rows.map((user: typeof usersSchema.$inferSelect) => this.mapToDomain({ user })))
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

  async save({ user }: { user: User }): Promise<Result<User, RepositoryError>> {
    try {
      const obj = user.toObject()

      // Convert to database format
      const row = {
        createdAt: obj.createdAt,
        email: obj.email,
        id: obj.id,
        passwordHash: user.getPasswordHash(), // Access private field via getter
        role: obj.role,
        updatedAt: obj.updatedAt,
      }

      // Upsert: insert or update if exists
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

  async delete({ id }: { id: string }): Promise<Result<boolean, RepositoryError>> {
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
      const rows = await this.db.select({ id: usersSchema.id }).from(usersSchema).where(sql`LOWER(${usersSchema.email}) = LOWER(${email})`).limit(1)

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
      return Ok(result[0]?.count ?? 0)
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
   *
   * This is where we convert infrastructure data structures
   * to domain entities. The domain entity validates itself.
   *
   * TODO (Tech Debt): This throws when validation fails. After error handling migration,
   * this should return Result and propagate to use cases.
   */
  private mapToDomain({ user }: { user: typeof usersSchema.$inferSelect }): User {
    const result = User.create({
      createdAt: new Date(user.createdAt),
      email: user.email,
      id: user.id,
      passwordHash: user.passwordHash,
      role: user.role as UserRole, // Type assertion safe because DB enforces valid values
      updatedAt: new Date(user.updatedAt),
    })

    if (!result.ok) {
      // This should never happen with data from the database
      // since it was validated on creation
      throw result.error
    }

    return result.value
  }
}
