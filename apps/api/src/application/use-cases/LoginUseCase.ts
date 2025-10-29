import { randomUUID } from 'node:crypto'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpirationDate,
} from '../../infrastructure/auth/jwtUtils.js'
import { verifyPassword } from '../../infrastructure/auth/passwordUtils.js'
import type { Env } from '../../infrastructure/config/env.js'
import type { LoginDTO, LoginResponseDTO, UserResponseDTO } from '../dtos/AuthDTO.js'

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
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly env: Env,
  ) {}

  async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user) {
      // Use generic error message to avoid revealing if email exists
      throw new ValidationError('Invalid email or password', 'credentials')
    }

    // Verify password
    const isPasswordValid = await verifyPassword(dto.password, user.getPasswordHash())
    if (!isPasswordValid) {
      // Use generic error message to avoid revealing if email exists
      throw new ValidationError('Invalid email or password', 'credentials')
    }

    // Generate tokens
    const refreshTokenId = randomUUID()

    const accessToken = generateAccessToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      this.env,
    )

    const refreshTokenString = generateRefreshToken(
      {
        userId: user.id,
        tokenId: refreshTokenId,
      },
      this.env,
    )

    // Store refresh token in database
    const refreshToken = RefreshToken.create({
      id: refreshTokenId,
      token: refreshTokenString,
      userId: user.id,
      expiresAt: getRefreshTokenExpirationDate(),
    })

    await this.refreshTokenRepository.save(refreshToken)

    // Return response
    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: this.mapToUserDTO(user),
    }
  }

  /**
   * Map domain entity to user response DTO
   */
  private mapToUserDTO(
    user: typeof import('../../domain/models/User.js').User.prototype,
  ): UserResponseDTO {
    const obj = user.toObject()
    return {
      id: obj.id,
      email: obj.email,
      role: obj.role,
      createdAt: obj.createdAt.toISOString(),
      updatedAt: obj.updatedAt.toISOString(),
    }
  }
}
