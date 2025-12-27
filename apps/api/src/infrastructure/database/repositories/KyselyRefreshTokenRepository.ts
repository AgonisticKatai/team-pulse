import { RefreshToken } from '@domain/models/refresh-token/index.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { KyselyDB } from '@infrastructure/database/kysely-connection.js'
import { collect, Err, Ok, RepositoryError, type Result, type UserId, type ValidationError } from '@team-pulse/shared'

/**
 * Kysely RefreshToken Repository (ADAPTER)
 *
 * Maps between database layer and domain layer:
 * - DB → Domain: Delegates validation to RefreshToken.create()
 * - Domain → DB: Uses RefreshToken.toPrimitives() for type-safe persistence
 *
 * All validation logic lives in the domain model, not here.
 */
export class KyselyRefreshTokenRepository implements IRefreshTokenRepository {
  private readonly db: KyselyDB

  private constructor({ db }: { db: KyselyDB }) {
    this.db = db
  }

  static create({ db }: { db: KyselyDB }): KyselyRefreshTokenRepository {
    return new KyselyRefreshTokenRepository({ db })
  }

  async findByToken({ token }: { token: string }): Promise<Result<RefreshToken | null, RepositoryError>> {
    try {
      const row = await this.db.selectFrom('refresh_tokens').selectAll().where('token', '=', token).executeTakeFirst()

      if (!row) {
        return Ok(null)
      }

      const domainResult = this.mapToDomain({ refreshToken: row })

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

  async findByUserId({ userId }: { userId: UserId }): Promise<Result<RefreshToken[], RepositoryError>> {
    try {
      const rows = await this.db.selectFrom('refresh_tokens').selectAll().where('user_id', '=', userId).execute()

      const mappedResults = rows.map((row) => this.mapToDomain({ refreshToken: row }))
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
      const primitives = refreshToken.toPrimitives()

      await this.db
        .insertInto('refresh_tokens')
        .values({
          created_at: primitives.createdAt,
          expires_at: primitives.expiresAt,
          id: primitives.id,
          token: primitives.token,
          user_id: primitives.userId,
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            expires_at: primitives.expiresAt,
            token: primitives.token,
            user_id: primitives.userId,
          }),
        )
        .execute()

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
      const result = await this.db.deleteFrom('refresh_tokens').where('token', '=', token).executeTakeFirst()
      return Ok(Number(result.numDeletedRows) > 0)
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

  async deleteByUserId({ userId }: { userId: UserId }): Promise<Result<number, RepositoryError>> {
    try {
      const result = await this.db.deleteFrom('refresh_tokens').where('user_id', '=', userId).executeTakeFirst()
      return Ok(Number(result.numDeletedRows))
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
      const result = await this.db.deleteFrom('refresh_tokens').where('expires_at', '<', now).executeTakeFirst()
      return Ok(Number(result.numDeletedRows))
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
   * Delegates all validation to RefreshToken.create()
   */
  private mapToDomain({
    refreshToken,
  }: {
    refreshToken: { id: string; token: string; user_id: string; expires_at: Date; created_at: Date }
  }): Result<RefreshToken, ValidationError> {
    return RefreshToken.create({
      createdAt: new Date(refreshToken.created_at),
      expiresAt: new Date(refreshToken.expires_at),
      id: refreshToken.id,        // String - RefreshToken.create() validates
      token: refreshToken.token,  // String - RefreshToken.create() validates
      userId: refreshToken.user_id, // String - RefreshToken.create() validates
    })
  }
}
