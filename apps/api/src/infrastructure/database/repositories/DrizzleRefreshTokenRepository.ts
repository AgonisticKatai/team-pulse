import { RefreshToken } from '@domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { Database } from '@infrastructure/database/connection.js'
import { refreshTokens as refreshTokensSchema } from '@infrastructure/database/schema.js'
import type { ValidationError } from '@team-pulse/shared'
import {
  collect,
  Err,
  IdUtils,
  Ok,
  type RefreshTokenId,
  RepositoryError,
  type Result,
  type UserId,
} from '@team-pulse/shared'
import { eq, lt } from 'drizzle-orm'

/**
 * Drizzle RefreshToken Repository (ADAPTER)
 * Implements strict typing mapping between DB (strings) and Domain (Branded Types).
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
      const [refreshToken] = await this.db
        .select()
        .from(refreshTokensSchema)
        .where(eq(refreshTokensSchema.token, token))
        .limit(1)

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

  // The signature uses UserId strictly
  async findByUserId({ userId }: { userId: UserId }): Promise<Result<RefreshToken[], RepositoryError>> {
    try {
      // Drizzle accepts 'UserId' here because under the hood it's a string.
      // TypeScript allows passing a "more specific" type (UserId) where a "more generic" type (string) is expected.
      const refreshTokens = await this.db
        .select()
        .from(refreshTokensSchema)
        .where(eq(refreshTokensSchema.userId, userId))

      const mappedResults = refreshTokens.map((row: typeof refreshTokensSchema.$inferSelect) =>
        this.mapToDomain({ refreshToken: row }),
      )

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

      // 'obj.id' is RefreshTokenId.
      // Drizzle expects string. Since RefreshTokenId extends string, this compiles without errors.
      const row = {
        createdAt: obj.createdAt,
        expiresAt: obj.expiresAt,
        id: obj.id,
        token: obj.token,
        userId: obj.userId,
      }

      await this.db
        .insert(refreshTokensSchema)
        .values(row)
        .onConflictDoUpdate({
          set: { expiresAt: row.expiresAt, token: row.token, userId: row.userId },
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

  // The signature uses UserId strictly
  async deleteByUserId({ userId }: { userId: UserId }): Promise<Result<number, RepositoryError>> {
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
   * HYDRATION:
   * Converts raw DB strings back to Branded Types using IdUtils.toId()
   */
  private mapToDomain({
    refreshToken,
  }: {
    refreshToken: typeof refreshTokensSchema.$inferSelect
  }): Result<RefreshToken, ValidationError> {
    // If the DB has an invalid ID (corrupted data), IdUtils will throw an error.
    // Since we are inside a try/catch in the public methods (findBy...),
    return RefreshToken.create({
      createdAt: new Date(refreshToken.createdAt),
      expiresAt: new Date(refreshToken.expiresAt),
      // HYDRATION
      id: IdUtils.toId<RefreshTokenId>(refreshToken.id),
      token: refreshToken.token,
      userId: IdUtils.toId<UserId>(refreshToken.userId),
    })
  }
}
