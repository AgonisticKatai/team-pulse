import type { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import type { IPasswordHasher } from '@features/auth/domain/services/password-hasher/IPasswordHasher.js'
import { UserMapper } from '@features/users/application/mappers/user/UserMapper.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { IMetricsService } from '@shared/monitoring/IMetricsService.js'
import type { LoginDTO, LoginResponseDTO, RepositoryError, ValidationError } from '@team-pulse/shared'
import { AuthenticationError, Err, Ok, type Result } from '@team-pulse/shared'

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

  async execute({
    dto,
  }: {
    dto: LoginDTO
  }): Promise<Result<LoginResponseDTO, AuthenticationError | RepositoryError | ValidationError>> {
    const findUserResult = await this.userRepository.findByEmail({ email: dto.email })

    if (!findUserResult.ok) return Err(findUserResult.error)

    if (!findUserResult.value)
      return Err(
        AuthenticationError.create({
          message: 'Invalid email or password',
          metadata: { field: 'credentials', reason: 'invalid_credentials' },
        }),
      )

    const verifyResult = await this.passwordHasher.verify({
      hash: findUserResult.value.getPasswordHash(),
      password: dto.password,
    })

    if (!verifyResult.ok) return Err(verifyResult.error)

    if (!verifyResult.value)
      return Err(
        AuthenticationError.create({
          message: 'Invalid email or password',
          metadata: { field: 'credentials', reason: 'invalid_credentials' },
        }),
      )

    const refreshTokenResult = this.tokenFactory.createRefreshToken({ userId: findUserResult.value.id })

    if (!refreshTokenResult.ok) return Err(refreshTokenResult.error)

    const saveResult = await this.refreshTokenRepository.save({ refreshToken: refreshTokenResult.value })

    if (!saveResult.ok) return Err(saveResult.error)

    const accessTokenResult = this.tokenFactory.createAccessToken({
      email: findUserResult.value.email,
      role: findUserResult.value.role,
      userId: findUserResult.value.id,
    })

    if (!accessTokenResult.ok) return Err(accessTokenResult.error)

    this.metricsService.recordLogin({ role: findUserResult.value.role.getValue() })

    return Ok({
      accessToken: accessTokenResult.value,
      refreshToken: refreshTokenResult.value.token,
      user: UserMapper.toDTO(findUserResult.value),
    })
  }
}
