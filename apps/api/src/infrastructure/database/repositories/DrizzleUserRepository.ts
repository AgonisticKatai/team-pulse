import type { UserRole } from '@team-pulse/shared'
import { eq, sql } from 'drizzle-orm'
import { RepositoryError } from '../../../domain/errors/RepositoryError.js'
import { User } from '../../../domain/models/User.js'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../../domain/types/Result.js'
import type { Database } from '../connection.js'
import { users } from '../schema.js'

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

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return this.mapToDomain(row)
  }

  async findByEmail(email: string): Promise<User | null> {
    // Case-insensitive email search using SQL LOWER
    const rows = await this.db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return this.mapToDomain(row)
  }

  async findAll(): Promise<Result<User[], RepositoryError>> {
    try {
      const rows = await this.db.select().from(users)

      return Ok(rows.map((row: typeof users.$inferSelect) => this.mapToDomain(row)))
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

  async save(user: User): Promise<User> {
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
      .insert(users)
      .values(row)
      .onConflictDoUpdate({
        set: {
          email: row.email,
          passwordHash: row.passwordHash,
          role: row.role,
          updatedAt: row.updatedAt,
        },
        target: users.id,
      })

    return user
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id))
    return result.count > 0
  }

  async existsByEmail(email: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1)

    return rows.length > 0
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(users)
    return result[0]?.count ?? 0
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
  private mapToDomain(row: typeof users.$inferSelect): User {
    const result = User.create({
      createdAt: new Date(row.createdAt),
      email: row.email,
      id: row.id,
      passwordHash: row.passwordHash,
      role: row.role as UserRole, // Type assertion safe because DB enforces valid values
      updatedAt: new Date(row.updatedAt),
    })

    if (!result.ok) {
      // Data corruption - should never happen in production
      throw new Error(
        `Failed to map database row to User entity: ${result.error.message}. User ID: ${row.id}`,
      )
    }

    return result.value
  }
}
