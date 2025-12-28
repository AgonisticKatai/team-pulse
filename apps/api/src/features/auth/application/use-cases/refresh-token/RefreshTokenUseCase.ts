import type { TokenFactory } from '@application/factories/TokenFactory.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { RefreshTokenDTO, RefreshTokenResponseDTO, RepositoryError, ValidationError } from '@team-pulse/shared'
import { AuthenticationError, Err, Ok, type Result } from '@team-pulse/shared'

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
    return new RefreshTokenUseCase({ refreshTokenRepository, tokenFactory, userRepository })
  }

  async execute({
    dto,
  }: {
    dto: RefreshTokenDTO
  }): Promise<Result<RefreshTokenResponseDTO, AuthenticationError | RepositoryError | ValidationError>> {
    // 1. Verify JWT signature
    const verifyResult = this.tokenFactory.verifyRefreshToken({ token: dto.refreshToken })
    if (!verifyResult.ok) return Err(verifyResult.error)

    // 2. Find in DB
    const findResult = await this.refreshTokenRepository.findByToken({ token: dto.refreshToken })
    if (!findResult.ok) return Err(findResult.error)

    const storedToken = findResult.value

    // Check for existence
    if (!storedToken) {
      return Err(
        AuthenticationError.create({
          message: 'Invalid or expired refresh token',
          metadata: { field: 'refreshToken', reason: 'token_not_found' },
        }),
      )
    }

    // 3. Integrity check
    // verifyResult.value.tokenId is the 'jti' of the JWT
    // storedToken.id is the Primary Key of the DB (EntityId)
    if (storedToken.id !== verifyResult.value.tokenId) {
      return Err(
        AuthenticationError.create({
          message: 'Invalid token identity',
          metadata: { field: 'refreshToken', reason: 'integrity_check_failed' },
        }),
      )
    }

    // 4. Check expiration (Entity logic)
    if (storedToken.isExpired()) {
      await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })
      return Err(
        AuthenticationError.create({
          message: 'Refresh token has expired',
          metadata: { field: 'refreshToken', reason: 'token_expired' },
        }),
      )
    }

    // 5. Get User
    const userResult = await this.userRepository.findById({ id: verifyResult.value.userId })

    // If DB fails or user doesn't exist, kill the token for security
    if (!(userResult.ok && userResult.value)) {
      await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })
      const reason = !userResult.ok ? 'db_error' : 'user_not_found'

      return Err(
        userResult.ok
          ? AuthenticationError.create({ message: 'User not found', metadata: { field: 'refreshToken', reason } })
          : userResult.error,
      )
    }

    // 6. Generate Access Token
    const accessTokenResult = this.tokenFactory.createAccessToken({
      email: userResult.value.email,
      role: userResult.value.role,
      userId: userResult.value.id,
    })
    if (!accessTokenResult.ok) return Err(accessTokenResult.error)

    // 7. ROTATION: Generate new Refresh Token (Entity)
    const refreshTokenResult = this.tokenFactory.createRefreshToken({ userId: userResult.value.id })
    if (!refreshTokenResult.ok) return Err(refreshTokenResult.error)

    // 8. ROTATION: Save new refresh token
    const saveResult = await this.refreshTokenRepository.save({ refreshToken: refreshTokenResult.value })
    if (!saveResult.ok) return Err(saveResult.error)

    // 9. ROTATION: Delete old refresh token (Best effort)
    await this.refreshTokenRepository.deleteByToken({ token: dto.refreshToken })

    return Ok({ accessToken: accessTokenResult.value, refreshToken: refreshTokenResult.value.token })
  }
}
