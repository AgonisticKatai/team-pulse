import { randomUUID } from 'node:crypto'
import type { LoginDTO, LoginResponseDTO } from '@team-pulse/shared'
import {
  type NotFoundError,
  type RepositoryError,
  ValidationError,
} from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpirationDate,
} from '../../infrastructure/auth/jwt-utils.js'
import { verifyPassword } from '../../infrastructure/auth/password-utils.js'
import type { Env } from '../../infrastructure/config/env.js'

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
  private readonly env: Env
  private readonly refreshTokenRepository: IRefreshTokenRepository
  private readonly userRepository: IUserRepository

  private constructor({
    env,
    refreshTokenRepository,
    userRepository,
  }: {
    env: Env
    refreshTokenRepository: IRefreshTokenRepository
    userRepository: IUserRepository
  }) {
    this.env = env
    this.refreshTokenRepository = refreshTokenRepository
    this.userRepository = userRepository
  }

  static create({
    env,
    refreshTokenRepository,
    userRepository,
  }: {
    env: Env
    refreshTokenRepository: IRefreshTokenRepository
    userRepository: IUserRepository
  }): LoginUseCase {
    return new LoginUseCase({ env, refreshTokenRepository, userRepository })
  }

  async execute(
    dto: LoginDTO,
  ): Promise<Result<LoginResponseDTO, NotFoundError | RepositoryError | ValidationError>> {
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

    const refreshTokenId = randomUUID()

    const refreshTokenString = generateRefreshToken({
      env: this.env,
      payload: {
        tokenId: refreshTokenId,
        userId: user.id.getValue(),
      },
    })

    const refreshTokenResult = RefreshToken.create({
      expiresAt: getRefreshTokenExpirationDate(),
      id: refreshTokenId,
      token: refreshTokenString,
      userId: user.id.getValue(),
    })

    if (!refreshTokenResult.ok) {
      return Err(refreshTokenResult.error)
    }

    const saveResult = await this.refreshTokenRepository.save({
      refreshToken: refreshTokenResult.value,
    })

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    const accessToken = generateAccessToken({
      env: this.env,
      payload: {
        email: user.email.getValue(),
        role: user.role.getValue(),
        userId: user.id.getValue(),
      },
    })

    return Ok({
      accessToken,
      refreshToken: refreshTokenString,
      user: user.toDTO(),
    })
  }
}
