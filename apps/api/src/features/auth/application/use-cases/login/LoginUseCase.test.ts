import { faker } from '@faker-js/faker'
import type { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import { LoginUseCase } from '@features/auth/application/use-cases/login/LoginUseCase.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import type { IPasswordHasher } from '@features/auth/domain/services/password-hasher/IPasswordHasher.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import { buildUser, buildValidRefreshToken } from '@shared/testing/index.js'
import type { LoginDTO } from '@team-pulse/shared'
import { AuthenticationError, Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let metricsService: IMetricsService
  let passwordHasher: IPasswordHasher
  let refreshTokenRepository: IRefreshTokenRepository
  let tokenFactory: TokenFactory
  let userRepository: IUserRepository

  beforeEach(() => {
    vi.clearAllMocks()

    metricsService = { recordLogin: vi.fn() } as unknown as IMetricsService
    passwordHasher = { verify: vi.fn() } as unknown as IPasswordHasher
    refreshTokenRepository = { save: vi.fn() } as unknown as IRefreshTokenRepository
    tokenFactory = { createAccessToken: vi.fn(), createRefreshToken: vi.fn() } as unknown as TokenFactory
    userRepository = { findByEmail: vi.fn() } as unknown as IUserRepository

    loginUseCase = LoginUseCase.create({
      metricsService,
      passwordHasher,
      refreshTokenRepository,
      tokenFactory,
      userRepository,
    })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should authenticate user and return tokens', async () => {
        // Arrange
        const user = buildUser()
        const dto = {
          email: user.email.getValue(),
          password: 'Password123!',
        } satisfies LoginDTO

        const refreshTokenEntity = buildValidRefreshToken({ userId: user.id })
        const accessTokenString = faker.string.alphanumeric(100)

        // Mocks Setup
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(refreshTokenEntity))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Ok(refreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(accessTokenString))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        // 1. Verify Response Structure
        expect(response.accessToken).toBe(accessTokenString)
        expect(response.refreshToken).toBe(refreshTokenEntity.token)
        expect(response.user.id).toBe(user.id)
        expect(response.user.email).toBe(user.email.getValue())

        // 2. Verify Flow
        expect(userRepository.findByEmail).toHaveBeenCalledWith({ email: dto.email })
        expect(passwordHasher.verify).toHaveBeenCalledWith({
          hash: user.getPasswordHash(),
          password: dto.password,
        })
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledWith({ userId: user.id })
        expect(refreshTokenRepository.save).toHaveBeenCalledWith({ refreshToken: refreshTokenEntity })

        // 3. Verify Side Effects (Metrics)
        expect(metricsService.recordLogin).toHaveBeenCalledWith({
          role: user.role.getValue(),
        })
      })
    })

    // -------------------------------------------------------------------------
    // ❌ VALIDATION ERRORS (Security)
    // -------------------------------------------------------------------------
    describe('Validation & Security Errors', () => {
      it('should return AuthenticationError when user does not exist', async () => {
        // Arrange
        const dto = {
          email: 'unknown@example.com',
          password: 'password',
        } satisfies LoginDTO

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.message).toBe('Invalid email or password')
        expect(error.metadata?.reason).toBe('invalid_credentials')
        expect(passwordHasher.verify).not.toHaveBeenCalled()
      })

      it('should return AuthenticationError when password does not match', async () => {
        // Arrange
        const user = buildUser()
        const dto = {
          email: user.email.getValue(),
          password: 'WrongPassword',
        } satisfies LoginDTO

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(false))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        expect(error.message).toBe('Invalid email or password')
        expect(error.metadata?.reason).toBe('invalid_credentials')
        expect(tokenFactory.createRefreshToken).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when finding user fails', async () => {
        // Arrange
        const dto = {
          email: faker.internet.email(),
          password: 'password',
        } satisfies LoginDTO

        const dbError = RepositoryError.forOperation({
          message: 'DB Connection failed',
          operation: 'findByEmail',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Err(dbError))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })

      it('should return RepositoryError when saving refresh token fails', async () => {
        // Arrange
        const user = buildUser()
        const dto = {
          email: user.email.getValue(),
          password: 'password',
        } satisfies LoginDTO

        const refreshToken = buildValidRefreshToken()
        const dbError = RepositoryError.forOperation({
          message: 'Write failed',
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(refreshToken))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Err(dbError))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })
    })
  })
})
