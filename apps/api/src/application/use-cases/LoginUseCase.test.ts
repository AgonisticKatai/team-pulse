import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { LoginUseCase } from '@application/use-cases/LoginUseCase.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IMetricsService } from '@domain/services/IMetricsService.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import { faker } from '@faker-js/faker'
import { buildLoginDTO, buildUser, buildValidRefreshToken } from '@infrastructure/testing/index.js'
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
    describe('successful login', () => {
      it('should authenticate user and return tokens', async () => {
        // Arrange
        const dto = buildLoginDTO() // Random email and password
        const user = buildUser({ email: dto.email }) // User that matches the DTO
        const refreshTokenEntity = buildValidRefreshToken({ userId: user.id })
        const accessTokenString = faker.string.alphanumeric(100)

        // Mocks Setup (The Happy Path Chain)
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true)) // Password matches
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(refreshTokenEntity))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Ok(refreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(accessTokenString))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const response = expectSuccess(result)

        // 1. Verify Response Structure
        expect(response.accessToken).toBe(accessTokenString)
        expect(response.refreshToken).toBe(refreshTokenEntity.token) // JWT string
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

    describe('error cases (security)', () => {
      it('should return "Invalid credentials" when user does not exist', async () => {
        // Arrange
        const dto = buildLoginDTO()
        // Simulate user not found
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        // 🛡️ SECURITY CHECK: Generic message to prevent enumeration
        expect(error.message).toBe('Invalid email or password')
        expect(error.metadata?.reason).toBe('invalid_credentials')

        // Ensure flow stopped early
        expect(passwordHasher.verify).not.toHaveBeenCalled()
      })

      it('should return "Invalid credentials" when password does not match', async () => {
        // Arrange
        const dto = buildLoginDTO()
        const user = buildUser({ email: dto.email })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        // Simulate wrong password
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(false))

        // Act
        const result = await loginUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: AuthenticationError, result })
        // 🛡️ SECURITY CHECK: Same message as "user not found"
        expect(error.message).toBe('Invalid email or password')
        expect(error.metadata?.reason).toBe('invalid_credentials')

        // Ensure we didn't generate tokens
        expect(tokenFactory.createRefreshToken).not.toHaveBeenCalled()
      })
    })

    describe('error cases (infrastructure)', () => {
      it('should return RepositoryError when finding user fails', async () => {
        // Arrange
        const dto = buildLoginDTO()
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
        const dto = buildLoginDTO()
        const user = buildUser()
        const refreshToken = buildValidRefreshToken()
        const dbError = RepositoryError.forOperation({
          message: 'Write failed',
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(user))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(refreshToken))
        // Simulate save failure
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
