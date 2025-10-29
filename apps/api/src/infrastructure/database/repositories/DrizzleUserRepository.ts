import type { UserRole } from '@team-pulse/shared'
import { eq, sql } from 'drizzle-orm'
import { User } from '../../../domain/models/User.js'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js'
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

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(users)

    return rows.map((row: typeof users.$inferSelect) => this.mapToDomain(row))
  }

  async save(user: User): Promise<User> {
    const obj = user.toObject()

    // Convert to database format
    const row = {
      id: obj.id,
      email: obj.email,
      passwordHash: user.getPasswordHash(), // Access private field via getter
      role: obj.role,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }

    // Upsert: insert or update if exists
    await this.db
      .insert(users)
      .values(row)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: row.email,
          passwordHash: row.passwordHash,
          role: row.role,
          updatedAt: row.updatedAt,
        },
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
   */
  private mapToDomain(row: typeof users.$inferSelect): User {
    return User.fromPersistence({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as UserRole, // Type assertion safe because DB enforces valid values
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    })
  }
}
