import { randomUUID } from 'node:crypto'
import type { LoginDTO, LoginResponseDTO, UserResponseDTO } from '@team-pulse/shared'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import type { User } from '../../domain/models/User.js'
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
  }): LoginUseCase {
    return new LoginUseCase({ env, refreshTokenRepository, userRepository })
  }

  async execute(dto: LoginDTO): Promise<Result<LoginResponseDTO, ValidationError>> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user) {
      // Use generic error message to avoid revealing if email exists
      return Err(
        ValidationError.forField({
          field: 'credentials',
          message: 'Invalid email or password',
        }),
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(dto.password, user.getPasswordHash())
    if (!isPasswordValid) {
      // Use generic error message to avoid revealing if email exists
      return Err(
        ValidationError.forField({
          field: 'credentials',
          message: 'Invalid email or password',
        }),
      )
    }

    // Generate tokens
    const refreshTokenId = randomUUID()

    const accessToken = generateAccessToken(
      {
        email: user.email.getValue(),
        role: user.role.getValue(),
        userId: user.id.getValue(),
      },
      this.env,
    )

    const refreshTokenString = generateRefreshToken(
      {
        tokenId: refreshTokenId,
        userId: user.id.getValue(),
      },
      this.env,
    )

    // Store refresh token in database
    const refreshTokenResult = RefreshToken.create({
      expiresAt: getRefreshTokenExpirationDate(),
      id: refreshTokenId,
      token: refreshTokenString,
      userId: user.id.getValue(),
    })

    if (!refreshTokenResult.ok) {
      return Err(refreshTokenResult.error)
    }

    await this.refreshTokenRepository.save(refreshTokenResult.value)

    // Return response
    return Ok({
      accessToken,
      refreshToken: refreshTokenString,
      user: this.mapToUserDTO(user),
    })
  }

  /**
   * Map domain entity to user response DTO
   */
  private mapToUserDTO(user: User): UserResponseDTO {
    return user.toDTO()
  }
}
