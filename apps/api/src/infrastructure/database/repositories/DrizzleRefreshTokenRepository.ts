import { eq, lt } from 'drizzle-orm'
import { RepositoryError } from '../../../domain/errors/RepositoryError.js'
import type { ValidationError } from '../../../domain/errors/ValidationError.js'
import { RefreshToken } from '../../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.js'
import { collect, Err, Ok, type Result } from '../../../domain/types/Result.js'
import type { Database } from '../connection.js'
import { refreshTokens as refreshTokensSchema } from '../schema.js'

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
  private readonly db: Database

  private constructor({ db }: { db: Database }) {
    this.db = db
  }

  static create({ db }: { db: Database }): DrizzleRefreshTokenRepository {
    return new DrizzleRefreshTokenRepository({ db })
  }

  async findByToken({ token }: { token: string }): Promise<Result<RefreshToken | null, RepositoryError>> {
    try {
      const [refreshToken] = await this.db.select().from(refreshTokensSchema).where(eq(refreshTokensSchema.token, token)).limit(1)

      if (!refreshToken) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ refreshToken })

      if (!domainResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: domainResult.error,
            message: 'Failed to map refresh token to domain',
            operation: 'findByToken',
          }),
        )
      }

      return Ok(domainResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find refresh token by token',
          operation: 'findByToken',
        }),
      )
    }
  }

  async findByUserId({ userId }: { userId: string }): Promise<Result<RefreshToken[], RepositoryError>> {
    try {
      const refreshTokens = await this.db.select().from(refreshTokensSchema).where(eq(refreshTokensSchema.userId, userId))

      const mappedResults = refreshTokens.map((row: typeof refreshTokensSchema.$inferSelect) => this.mapToDomain({ refreshToken: row }))

      const collectedResult = collect(mappedResults)

      if (!collectedResult.ok) {
        return Err(
          RepositoryError.forOperation({
            cause: collectedResult.error,
            message: 'Failed to map refresh token to domain',
            operation: 'findByUserId',
          }),
        )
      }

      return Ok(collectedResult.value)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to find refresh tokens by user id',
          operation: 'findByUserId',
        }),
      )
    }
  }

  async save({ refreshToken }: { refreshToken: RefreshToken }): Promise<Result<RefreshToken, RepositoryError>> {
    try {
      const obj = refreshToken.toObject()

      // Convert to database format
      const row = {
        createdAt: obj.createdAt,
        expiresAt: obj.expiresAt,
        id: obj.id,
        token: obj.token,
        userId: obj.userId,
      }

      // Upsert: insert or update if exists
      await this.db
        .insert(refreshTokensSchema)
        .values(row)
        .onConflictDoUpdate({
          set: {
            expiresAt: row.expiresAt,
            token: row.token,
            userId: row.userId,
          },
          target: refreshTokensSchema.id,
        })

      return Ok(refreshToken)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to save refresh token',
          operation: 'save',
        }),
      )
    }
  }

  async deleteByToken({ token }: { token: string }): Promise<Result<boolean, RepositoryError>> {
    try {
      const result = await this.db.delete(refreshTokensSchema).where(eq(refreshTokensSchema.token, token))
      return Ok(result.count > 0)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to delete refresh token by token',
          operation: 'deleteByToken',
        }),
      )
    }
  }

  async deleteByUserId({ userId }: { userId: string }): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db.delete(refreshTokensSchema).where(eq(refreshTokensSchema.userId, userId))
      return Ok(result.count)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to delete refresh tokens by user id',
          operation: 'deleteByUserId',
        }),
      )
    }
  }

  async deleteExpired(): Promise<Result<number, RepositoryError>> {
    const now = new Date()
    try {
      const result = await this.db.delete(refreshTokensSchema).where(lt(refreshTokensSchema.expiresAt, now))
      return Ok(result.count)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : new Error(String(error)),
          message: 'Failed to delete expired refresh tokens',
          operation: 'deleteExpired',
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
  private mapToDomain({ refreshToken }: { refreshToken: typeof refreshTokensSchema.$inferSelect }): Result<RefreshToken, ValidationError> {
    return RefreshToken.create({
      createdAt: new Date(refreshToken.createdAt),
      expiresAt: new Date(refreshToken.expiresAt),
      id: refreshToken.id,
      token: refreshToken.token,
      userId: refreshToken.userId,
    })
  }
}
