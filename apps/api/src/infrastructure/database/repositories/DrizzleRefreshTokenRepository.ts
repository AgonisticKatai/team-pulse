import { eq, lt } from 'drizzle-orm'
import { RefreshToken } from '../../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js'
import type { Database } from '../connection.js'
import { refreshTokens } from '../schema.js'

/**
 * Drizzle RefreshToken Repository (ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the IRefreshTokenRepository PORT (defined in domain)
 * - Uses Drizzle ORM for database operations
 * - Maps between domain entities (RefreshToken) and database rows (RefreshTokenRow)
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
export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Database) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const rows = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return null
    }

    return this.mapToDomain(row)
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const rows = await this.db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId))

    return rows.map((row: typeof refreshTokens.$inferSelect) => this.mapToDomain(row))
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const obj = refreshToken.toObject()

    // Convert to database format
    const row = {
      id: obj.id,
      token: obj.token,
      userId: obj.userId,
      expiresAt: obj.expiresAt,
      createdAt: obj.createdAt,
    }

    // Upsert: insert or update if exists
    await this.db
      .insert(refreshTokens)
      .values(row)
      .onConflictDoUpdate({
        target: refreshTokens.id,
        set: {
          token: row.token,
          userId: row.userId,
          expiresAt: row.expiresAt,
        },
      })

    return refreshToken
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token))
    return result.count > 0
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
    return result.count
  }

  async deleteExpired(): Promise<number> {
    const now = new Date()
    const result = await this.db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now))
    return result.count
  }

  /**
   * Map database row to domain entity
   *
   * This is where we convert infrastructure data structures
   * to domain entities. The domain entity validates itself.
   */
  private mapToDomain(row: typeof refreshTokens.$inferSelect): RefreshToken {
    return RefreshToken.fromPersistence({
      id: row.id,
      token: row.token,
      userId: row.userId,
      expiresAt: new Date(row.expiresAt),
      createdAt: new Date(row.createdAt),
    })
  }
}
