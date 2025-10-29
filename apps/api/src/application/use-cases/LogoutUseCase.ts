import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'

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
 */
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    // Delete refresh token from database (revoke it)
    // If token doesn't exist, that's fine (already logged out or invalid)
    await this.refreshTokenRepository.deleteByToken(refreshToken)
  }
}
