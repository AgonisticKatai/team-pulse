import type { RefreshTokenDTO, RefreshTokenResponseDTO } from '@team-pulse/shared'
import { ValidationError } from '../../domain/errors/index.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import {
  generateAccessToken,
  type RefreshTokenPayload,
  verifyRefreshToken,
} from '../../infrastructure/auth/jwt-utils.js'
import type { Env } from '../../infrastructure/config/env.js'

/**
 * Refresh Token Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Validates a refresh token
 * - Generates a new access token
 *
 * Responsibilities:
 * 1. Verify refresh token JWT signature
 * 2. Check if refresh token exists in database (not revoked)
 * 3. Check if refresh token has expired
 * 4. Get user from database
 * 5. Generate new access token
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 */
export class RefreshTokenUseCase {
  private readonly userRepository: IUserRepository
  private readonly refreshTokenRepository: IRefreshTokenRepository
  private readonly env: Env

  private constructor({
    userRepository,
    refreshTokenRepository,
    env,
  }: {
    userRepository: IUserRepository
    refreshTokenRepository: IRefreshTokenRepository
    env: Env
  }) {
    this.userRepository = userRepository
    this.refreshTokenRepository = refreshTokenRepository
    this.env = env
  }

  static create({
    userRepository,
    refreshTokenRepository,
    env,
  }: {
    userRepository: IUserRepository
    refreshTokenRepository: IRefreshTokenRepository
    env: Env
  }): RefreshTokenUseCase {
    return new RefreshTokenUseCase({ env, refreshTokenRepository, userRepository })
  }

  async execute(dto: RefreshTokenDTO): Promise<Result<RefreshTokenResponseDTO, ValidationError>> {
    // Verify JWT signature and decode payload
    let payload: RefreshTokenPayload
    try {
      payload = verifyRefreshToken(dto.refreshToken, this.env)
    } catch (error) {
      return Err(
        ValidationError.forField({
          field: 'refreshToken',
          message: error instanceof Error ? error.message : 'Invalid refresh token',
        }),
      )
    }

    // Check if refresh token exists in database (not revoked)
    const refreshToken = await this.refreshTokenRepository.findByToken(dto.refreshToken)
    if (!refreshToken) {
      return Err(
        ValidationError.forField({
          field: 'refreshToken',
          message: 'Refresh token has been revoked',
        }),
      )
    }

    // Check if refresh token has expired
    if (refreshToken.isExpired()) {
      // Clean up expired token
      await this.refreshTokenRepository.deleteByToken(dto.refreshToken)
      return Err(
        ValidationError.forField({
          field: 'refreshToken',
          message: 'Refresh token has expired',
        }),
      )
    }

    // Get user from database (ensure user still exists and is active)
    const user = await this.userRepository.findById(payload.userId)
    if (!user) {
      // User was deleted, invalidate token
      await this.refreshTokenRepository.deleteByToken(dto.refreshToken)
      return Err(
        ValidationError.forField({
          field: 'refreshToken',
          message: 'User no longer exists',
        }),
      )
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      {
        email: user.email.getValue(),
        role: user.role.getValue(),
        userId: user.id.getValue(),
      },
      this.env,
    )

    return Ok({
      accessToken,
    })
  }
}
