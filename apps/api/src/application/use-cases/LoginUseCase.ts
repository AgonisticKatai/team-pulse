import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { type NotFoundError, type RepositoryError, ValidationError } from '@domain/errors/index.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import type { LoginDTO, LoginResponseDTO } from '@team-pulse/shared/dtos'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

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
  private readonly metricsService: IMetricsService
  private readonly passwordHasher: IPasswordHasher
  private readonly refreshTokenRepository: IRefreshTokenRepository
  private readonly tokenFactory: TokenFactory
  private readonly userRepository: IUserRepository

  private constructor({
    metricsService,
    passwordHasher,
    refreshTokenRepository,
    tokenFactory,
    userRepository,
  }: {
    metricsService: IMetricsService
    passwordHasher: IPasswordHasher
    refreshTokenRepository: IRefreshTokenRepository
    tokenFactory: TokenFactory
    userRepository: IUserRepository
  }) {
    this.metricsService = metricsService
    this.passwordHasher = passwordHasher
    this.refreshTokenRepository = refreshTokenRepository
    this.tokenFactory = tokenFactory
    this.userRepository = userRepository
  }

  static create({
    metricsService,
    passwordHasher,
    refreshTokenRepository,
    tokenFactory,
    userRepository,
  }: {
    metricsService: IMetricsService
    passwordHasher: IPasswordHasher
    refreshTokenRepository: IRefreshTokenRepository
    tokenFactory: TokenFactory
    userRepository: IUserRepository
  }): LoginUseCase {
    return new LoginUseCase({ metricsService, passwordHasher, refreshTokenRepository, tokenFactory, userRepository })
  }

  async execute(dto: LoginDTO): Promise<Result<LoginResponseDTO, NotFoundError | RepositoryError | ValidationError>> {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findUserResult.ok) {
      return Err(findUserResult.error)
    }

    if (!findUserResult.value) {
      return Err(ValidationError.forField({ field: 'credentials', message: 'Invalid email or password' }))
    }

    const verifyResult = await this.passwordHasher.verify({ password: dto.password, hash: findUserResult.value.getPasswordHash() })

    if (!verifyResult.ok) {
      return Err(verifyResult.error)
    }

    if (!verifyResult.value) {
      return Err(ValidationError.forField({ field: 'credentials', message: 'Invalid email or password' }))
    }

    const refreshTokenResult = this.tokenFactory.createRefreshToken({ userId: findUserResult.value.id.getValue() })

    if (!refreshTokenResult.ok) {
      return Err(refreshTokenResult.error)
    }

    const refreshToken = refreshTokenResult.value

    const saveResult = await this.refreshTokenRepository.save({ refreshToken })

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    const accessTokenResult = this.tokenFactory.createAccessToken({
      email: findUserResult.value.email.getValue(),
      role: findUserResult.value.role.getValue(),
      userId: findUserResult.value.id.getValue(),
    })

    if (!accessTokenResult.ok) {
      return Err(accessTokenResult.error)
    }

    this.metricsService.recordLogin({ role: findUserResult.value.role.getValue() })

    return Ok({
      accessToken: accessTokenResult.value,
      refreshToken: refreshToken.token,
      user: findUserResult.value.toDTO(),
    })
  }
}
