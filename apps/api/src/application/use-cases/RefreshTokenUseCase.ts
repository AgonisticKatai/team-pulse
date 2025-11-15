import type { RefreshTokenDTO, RefreshTokenResponseDTO } from '@team-pulse/shared'
import { NotFoundError, type RepositoryError, ValidationError } from '../../domain/errors/index.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import type { TokenFactory } from '../factories/TokenFactory.js'

/**
 * Refresh Token Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Validates a refresh token
 * - Generates a new access token AND new refresh token (rotation)
 *
 * Responsibilities:
 * 1. Verify refresh token JWT signature
 * 2. Check if refresh token exists in database (not revoked)
 * 3. Check if refresh token has expired
 * 4. Get user from database
 * 5. Generate new access token
 * 6. Generate new refresh token (ROTATION)
 * 7. Delete old refresh token
 * 8. Save new refresh token
 *
 * SECURITY: Token Rotation
 * - Each refresh request generates a new refresh token
 * - The old refresh token is immediately invalidated
 * - This reduces the window of opportunity if a token is compromised
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 */
export class RefreshTokenUseCase {
  private readonly tokenFactory: TokenFactory
  private readonly refreshTokenRepository: IRefreshTokenRepository
  private readonly userRepository: IUserRepository

  private constructor({
    tokenFactory,
    refreshTokenRepository,
    userRepository,
  }: { tokenFactory: TokenFactory; refreshTokenRepository: IRefreshTokenRepository; userRepository: IUserRepository }) {
    this.tokenFactory = tokenFactory
    this.refreshTokenRepository = refreshTokenRepository
    this.userRepository = userRepository
  }

  static create({
    tokenFactory,
    refreshTokenRepository,
    userRepository,
  }: {
    tokenFactory: TokenFactory
    refreshTokenRepository: IRefreshTokenRepository
    userRepository: IUserRepository
  }): RefreshTokenUseCase {
    return new RefreshTokenUseCase({ tokenFactory, refreshTokenRepository, userRepository })
  }

  async execute(dto: RefreshTokenDTO): Promise<Result<RefreshTokenResponseDTO, NotFoundError | RepositoryError | ValidationError>> {
    const verifyRefreshTokenResult = this.tokenFactory.verifyRefreshToken({ token: dto.refreshToken })

    if (!verifyRefreshTokenResult.ok) {
      return Err(verifyRefreshTokenResult.error)
    }

    const findRefreshTokenResult = await this.refreshTokenRepository.findByToken({ token: dto.refreshToken })

    if (!findRefreshTokenResult.ok) {
      return Err(findRefreshTokenResult.error)
    }

    if (!findRefreshTokenResult.value) {
      return Err(NotFoundError.create({ entityName: 'RefreshToken', identifier: dto.refreshToken }))
    }

    if (findRefreshTokenResult.value.isExpired()) {
      const deleteRefreshTokenResult = await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })

      if (!deleteRefreshTokenResult.ok) {
        return Err(deleteRefreshTokenResult.error)
      }

      return Err(ValidationError.forField({ field: 'refreshToken', message: 'Refresh token has expired' }))
    }

    const userResult = await this.userRepository.findById({ id: verifyRefreshTokenResult.value.userId })

    if (!userResult.ok) {
      await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })
      return Err(userResult.error)
    }

    if (!userResult.value) {
      await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })
      return Err(NotFoundError.create({ entityName: 'User', identifier: verifyRefreshTokenResult.value.userId }))
    }

    const createAccessTokenResult = this.tokenFactory.createAccessToken({
      email: userResult.value.email.getValue(),
      role: userResult.value.role.getValue(),
      userId: userResult.value.id.getValue(),
    })

    if (!createAccessTokenResult.ok) {
      return Err(createAccessTokenResult.error)
    }

    // TOKEN ROTATION: Generate new refresh token
    const createRefreshTokenResult = this.tokenFactory.createRefreshToken({
      userId: userResult.value.id.getValue(),
    })

    if (!createRefreshTokenResult.ok) {
      return Err(createRefreshTokenResult.error)
    }

    // TOKEN ROTATION: Save new refresh token
    const saveRefreshTokenResult = await this.refreshTokenRepository.save({
      refreshToken: createRefreshTokenResult.value,
    })

    if (!saveRefreshTokenResult.ok) {
      return Err(saveRefreshTokenResult.error)
    }

    // TOKEN ROTATION: Delete old refresh token
    const deleteOldTokenResult = await this.refreshTokenRepository.deleteByToken({
      token: dto.refreshToken,
    })

    if (!deleteOldTokenResult.ok) {
      // Don't fail the request if we can't delete the old token
      // It will be cleaned up by the expired token cleanup job
      // Just log the error (will be implemented with logging system)
    }

    return Ok({
      accessToken: createAccessTokenResult.value,
      refreshToken: createRefreshTokenResult.value.token,
    })
  }
}
