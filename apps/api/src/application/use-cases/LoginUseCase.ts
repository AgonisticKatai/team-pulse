import type { LoginDTO, LoginResponseDTO } from '@team-pulse/shared'
import { type NotFoundError, type RepositoryError, ValidationError } from '../../domain/errors/index.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import { verifyPassword } from '../../infrastructure/auth/password-utils.js'
import type { TokenFactory } from '../factories/TokenFactory.js'

/**
 * Login Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Authenticates a user with email and password
 * - Generates access and refresh tokens
 * - Stores refresh token in database for later validation
 *
 * Responsibilities:
 * 1. Find user by email
 * 2. Verify password
 * 3. Generate access and refresh tokens
 * 4. Store refresh token in database
 * 5. Return tokens and user info
 *
 * Note: This doesn't know about HTTP, Fastify, or any framework.
 * It's PURE business logic.
 */
export class LoginUseCase {
  private readonly tokenFactory: TokenFactory
  private readonly refreshTokenRepository: IRefreshTokenRepository
  private readonly userRepository: IUserRepository

  private constructor({
    tokenFactory,
    refreshTokenRepository,
    userRepository,
  }: {
    tokenFactory: TokenFactory
    refreshTokenRepository: IRefreshTokenRepository
    userRepository: IUserRepository
  }) {
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
  }): LoginUseCase {
    return new LoginUseCase({ tokenFactory, refreshTokenRepository, userRepository })
  }

  async execute(dto: LoginDTO): Promise<Result<LoginResponseDTO, NotFoundError | RepositoryError | ValidationError>> {
    const findResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findResult.ok) {
      return Err(findResult.error)
    }

    const user = findResult.value

    if (!user) {
      return Err(
        ValidationError.forField({
          field: 'credentials',
          message: 'Invalid email or password',
        }),
      )
    }

    const isPasswordValid = await verifyPassword(dto.password, user.getPasswordHash())

    if (!isPasswordValid) {
      return Err(
        ValidationError.forField({
          field: 'credentials',
          message: 'Invalid email or password',
        }),
      )
    }

    // Create refresh token (coordinates JWT generation + domain entity creation)
    const refreshTokenResult = this.tokenFactory.createRefreshToken({
      userId: user.id.getValue(),
    })

    if (!refreshTokenResult.ok) {
      return Err(refreshTokenResult.error)
    }

    const refreshToken = refreshTokenResult.value

    const saveResult = await this.refreshTokenRepository.save({
      refreshToken,
    })

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    // Create access token
    const accessTokenResult = this.tokenFactory.createAccessToken({
      email: user.email.getValue(),
      role: user.role.getValue(),
      userId: user.id.getValue(),
    })

    if (!accessTokenResult.ok) {
      return Err(accessTokenResult.error)
    }

    return Ok({
      accessToken: accessTokenResult.value,
      refreshToken: refreshToken.token,
      user: user.toDTO(),
    })
  }
}
