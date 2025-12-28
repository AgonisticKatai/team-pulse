import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import { Ok, type Result } from '@team-pulse/shared'

/**
 * Logout Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Invalidates a refresh token by deleting it from the database
 * - This prevents it from being used to generate new access tokens
 *
 * Responsibilities:
 * 1. Delete refresh token from database
 *
 * Note: Access tokens cannot be revoked as they are stateless.
 * They will expire after 15 minutes.
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 *
 * Note: This operation is idempotent - logout always succeeds regardless
 * of whether the token exists. From a business perspective, if the user
 * wants to logout, they are logged out.
 */
export class LogoutUseCase {
  private readonly refreshTokenRepository: IRefreshTokenRepository

  private constructor({ refreshTokenRepository }: { refreshTokenRepository: IRefreshTokenRepository }) {
    this.refreshTokenRepository = refreshTokenRepository
  }

  static create({ refreshTokenRepository }: { refreshTokenRepository: IRefreshTokenRepository }): LogoutUseCase {
    return new LogoutUseCase({ refreshTokenRepository })
  }

  async execute({ refreshToken }: { refreshToken: string }): Promise<Result<void, never>> {
    await this.refreshTokenRepository.deleteByToken({ token: refreshToken })

    return Ok(undefined)
  }
}
