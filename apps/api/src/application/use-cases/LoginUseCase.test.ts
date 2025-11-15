import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RepositoryError, ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.js'
import { Err, Ok } from '../../domain/types/Result.js'
import {
  buildAdminUser,
  buildLoginDTO,
  buildSuperAdminUser,
  buildUser,
  expectErrorType,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import type { TokenFactory } from '../factories/TokenFactory.js'
import { LoginUseCase } from './LoginUseCase.js'

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let tokenFactory: TokenFactory
  let passwordHasher: IPasswordHasher

  // Mock user data
  const mockUser = buildUser()

  // Mock refresh token
  const mockRefreshTokenResult = RefreshToken.create({
    id: TEST_CONSTANTS.mockUuid,
    token: TEST_CONSTANTS.auth.mockRefreshToken,
    userId: mockUser.id.getValue(),
    expiresAt: TEST_CONSTANTS.futureDate,
  })
  if (!mockRefreshTokenResult.ok) throw new Error('Failed to create mock refresh token')
  const mockRefreshToken = mockRefreshTokenResult.value

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock TokenFactory
    tokenFactory = {
      createAccessToken: vi.fn(() => Ok(TEST_CONSTANTS.auth.mockAccessToken)),
      createRefreshToken: vi.fn(() => Ok(mockRefreshToken)),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    } as unknown as TokenFactory

    // Mock repositories
    userRepository = {
      count: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      findAllPaginated: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    }

    refreshTokenRepository = {
      deleteByToken: vi.fn(),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
      findByToken: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
    }

    // Mock password hasher
    passwordHasher = {
      hash: vi.fn(),
      verify: vi.fn(() => Promise.resolve(Ok(true))),
    }

    // Create use case instance
    loginUseCase = LoginUseCase.create({ tokenFactory, refreshTokenRepository, userRepository, passwordHasher })
  })

  describe('execute', () => {
    describe('successful login', () => {
      it('should authenticate user with valid credentials', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.accessToken).toBe(TEST_CONSTANTS.auth.mockAccessToken)
        expect(data.refreshToken).toBe(TEST_CONSTANTS.auth.mockRefreshToken)
        expect(data.user).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: TEST_CONSTANTS.users.johnDoe.email,
          id: TEST_CONSTANTS.users.johnDoe.id,
          role: TEST_CONSTANTS.users.johnDoe.role,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should call userRepository.findByEmail with correct email', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.johnDoe.email,
        })
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should verify password with user password hash', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(passwordHasher.verify).toHaveBeenCalledWith({
          password: TEST_CONSTANTS.users.johnDoe.password,
          hash: TEST_CONSTANTS.users.johnDoe.passwordHash,
        })
        expect(passwordHasher.verify).toHaveBeenCalledTimes(1)
      })

      it('should generate access token with correct payload', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.johnDoe.email,
          role: TEST_CONSTANTS.users.johnDoe.role,
          userId: TEST_CONSTANTS.users.johnDoe.id,
        })
        expect(tokenFactory.createAccessToken).toHaveBeenCalledTimes(1)
      })

      it('should generate refresh token with correct payload', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledWith({
          userId: TEST_CONSTANTS.users.johnDoe.id,
        })
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should save refresh token to repository', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)

        const { refreshToken: savedToken } = expectMockCallArg<{ refreshToken: RefreshToken }>(vi.mocked(refreshTokenRepository.save))

        expect(savedToken).toBeInstanceOf(RefreshToken)
        expect(savedToken.id.getValue()).toBe(TEST_CONSTANTS.mockUuid)
        expect(savedToken.token).toBe(TEST_CONSTANTS.auth.mockRefreshToken)
        expect(savedToken.userId.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.id)
        expect(savedToken.expiresAt).toEqual(TEST_CONSTANTS.futureDate)
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user).not.toHaveProperty('passwordHash')
        expect(data.user).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: TEST_CONSTANTS.users.johnDoe.email,
          id: TEST_CONSTANTS.users.johnDoe.id,
          role: TEST_CONSTANTS.users.johnDoe.role,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })
    })

    describe('error cases', () => {
      it('should return ValidationError when user does not exist', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ email: 'nonexistent@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
      })

      it('should not verify password when user does not exist', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ email: 'nonexistent@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(passwordHasher.verify).not.toHaveBeenCalled()
      })

      it('should return ValidationError when password is incorrect', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.invalid.wrongPassword })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(false))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
      })

      it('should not generate tokens when password is incorrect', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.invalid.wrongPassword })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(false))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(tokenFactory.createAccessToken).not.toHaveBeenCalled()
        expect(tokenFactory.createRefreshToken).not.toHaveBeenCalled()
        expect(refreshTokenRepository.save).not.toHaveBeenCalled()
      })

      it('should use generic error message to avoid user enumeration', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.invalid.wrongPassword })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(false))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert - Error message should be the same for "user not found" and "wrong password"
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
        expect(error.field).toBe('credentials')
      })

      it('should return RepositoryError when saving refresh token fails', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()
        const repositoryError = RepositoryError.forOperation({
          cause: new Error('Database connection failed'),
          message: 'Failed to save refresh token',
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe('Failed to save refresh token')
        expect(error.operation).toBe('save')
      })

      it('should not generate access token when refresh token save fails', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()
        const repositoryError = RepositoryError.forOperation({
          cause: new Error('Database connection failed'),
          message: 'Failed to save refresh token',
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: RepositoryError, result })
        // Access token should still be generated, but the overall operation should fail
        // This is intentional - we fail fast before returning tokens to the user
        expect(tokenFactory.createAccessToken).not.toHaveBeenCalled()
      })

      it('should verify password and generate refresh token before attempting to save', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()
        const repositoryError = RepositoryError.forOperation({
          cause: new Error('Database connection failed'),
          message: 'Failed to save refresh token',
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: RepositoryError, result })
        // These operations should have been called before the save fails
        expect(passwordHasher.verify).toHaveBeenCalledTimes(1)
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledTimes(1)
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()

        const loginDTO = buildLoginDTO({
          email: TEST_CONSTANTS.users.adminUser.email,
          password: TEST_CONSTANTS.users.adminUser.password,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(adminUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user.role).toBe(TEST_CONSTANTS.users.adminUser.role)
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const loginDTO = buildLoginDTO({
          email: TEST_CONSTANTS.users.superAdminUser.email,
          password: TEST_CONSTANTS.users.superAdminUser.password,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(superAdminUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user.role).toBe(TEST_CONSTANTS.users.superAdminUser.role)
      })

      it('should convert dates to ISO strings in user DTO', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))
        vi.mocked(passwordHasher.verify).mockResolvedValue(Ok(true))
        vi.mocked(refreshTokenRepository.save).mockImplementation(async ({ refreshToken }) => Ok(refreshToken))

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(typeof data.user.createdAt).toBe('string')
        expect(typeof data.user.updatedAt).toBe('string')
        expect(data.user.createdAt).toBe(TEST_CONSTANTS.mockDateIso)
        expect(data.user.updatedAt).toBe(TEST_CONSTANTS.mockDateIso)
      })
    })
  })
})
