import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { Env } from '../../infrastructure/config/env.js'
import {
  buildAdminUser,
  buildLoginDTO,
  buildSuperAdminUser,
  buildUser,
  expectErrorType,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { LoginUseCase } from './LoginUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/jwtUtils.js', () => ({
  generateAccessToken: vi.fn(() => TEST_CONSTANTS.AUTH.MOCK_ACCESS_TOKEN),
  generateRefreshToken: vi.fn(() => TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN),
  getRefreshTokenExpirationDate: vi.fn(() => TEST_CONSTANTS.FUTURE_DATE),
}))

vi.mock('../../infrastructure/auth/passwordUtils.js', () => ({
  verifyPassword: vi.fn(),
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.MOCK_UUID),
}))

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let env: Env

  // Mock user data
  const mockUser = buildUser()

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock environment
    env = TEST_CONSTANTS.MOCK_ENV

    // Mock repositories
    userRepository = {
      count: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
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

    // Create use case instance
    loginUseCase = new LoginUseCase(userRepository, refreshTokenRepository, env)
  })

  describe('execute', () => {
    describe('successful login', () => {
      it('should authenticate user with valid credentials', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.accessToken).toBe(TEST_CONSTANTS.AUTH.MOCK_ACCESS_TOKEN)
        expect(data.refreshToken).toBe(TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN)
        expect(data.user).toEqual({
          createdAt: TEST_CONSTANTS.MOCK_DATE_ISO,
          email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
          id: TEST_CONSTANTS.USERS.JOHN_DOE.id,
          role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
          updatedAt: TEST_CONSTANTS.MOCK_DATE_ISO,
        })
      })

      it('should call userRepository.findByEmail with correct email', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).toHaveBeenCalledWith(TEST_CONSTANTS.USERS.JOHN_DOE.email)
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should verify password with user password hash', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(verifyPassword).toHaveBeenCalledWith(
          TEST_CONSTANTS.USERS.JOHN_DOE.password,
          TEST_CONSTANTS.USERS.JOHN_DOE.passwordHash,
        )
        expect(verifyPassword).toHaveBeenCalledTimes(1)
      })

      it('should generate access token with correct payload', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        const { generateAccessToken } = await import('../../infrastructure/auth/jwtUtils.js')

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
            role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
            userId: TEST_CONSTANTS.USERS.JOHN_DOE.id,
          },
          env,
        )
        expect(generateAccessToken).toHaveBeenCalledTimes(1)
      })

      it('should generate refresh token with correct payload', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        const { generateRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(generateRefreshToken).toHaveBeenCalledWith(
          {
            tokenId: TEST_CONSTANTS.MOCK_UUID,
            userId: TEST_CONSTANTS.USERS.JOHN_DOE.id,
          },
          env,
        )
        expect(generateRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should save refresh token to repository', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
        const savedToken = expectMockCallArg<RefreshToken>(vi.mocked(refreshTokenRepository.save))
        expect(savedToken).toBeInstanceOf(RefreshToken)
        expect(savedToken.id.getValue()).toBe(TEST_CONSTANTS.MOCK_UUID)
        expect(savedToken.token).toBe(TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN)
        expect(savedToken.userId.getValue()).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.id)
        expect(savedToken.expiresAt).toEqual(TEST_CONSTANTS.FUTURE_DATE)
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user).not.toHaveProperty('passwordHash')
        expect(data.user).toEqual({
          createdAt: TEST_CONSTANTS.MOCK_DATE_ISO,
          email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
          id: TEST_CONSTANTS.USERS.JOHN_DOE.id,
          role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
          updatedAt: TEST_CONSTANTS.MOCK_DATE_ISO,
        })
      })
    })

    describe('error cases', () => {
      it('should return ValidationError when user does not exist', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ email: 'nonexistent@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
      })

      it('should not verify password when user does not exist', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ email: 'nonexistent@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(verifyPassword).not.toHaveBeenCalled()
      })

      it('should return ValidationError when password is incorrect', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.INVALID.WRONG_PASSWORD })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
      })

      it('should not generate tokens when password is incorrect', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.INVALID.WRONG_PASSWORD })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        const { generateAccessToken, generateRefreshToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(generateAccessToken).not.toHaveBeenCalled()
        expect(generateRefreshToken).not.toHaveBeenCalled()
        expect(refreshTokenRepository.save).not.toHaveBeenCalled()
      })

      it('should use generic error message to avoid user enumeration', async () => {
        // Arrange
        const loginDTO = buildLoginDTO({ password: TEST_CONSTANTS.INVALID.WRONG_PASSWORD })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert - Error message should be the same for "user not found" and "wrong password"
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid email or password')
        expect(error.field).toBe('credentials')
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()

        const loginDTO = buildLoginDTO({
          email: TEST_CONSTANTS.USERS.ADMIN_USER.email,
          password: TEST_CONSTANTS.USERS.ADMIN_USER.password,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(adminUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user.role).toBe(TEST_CONSTANTS.USERS.ADMIN_USER.role)
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const loginDTO = buildLoginDTO({
          email: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.email,
          password: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.password,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(superAdminUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(data.user.role).toBe(TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role)
      })

      it('should convert dates to ISO strings in user DTO', async () => {
        // Arrange
        const loginDTO = buildLoginDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        const data = expectSuccess(result)
        expect(typeof data.user.createdAt).toBe('string')
        expect(typeof data.user.updatedAt).toBe('string')
        expect(data.user.createdAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
        expect(data.user.updatedAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
      })
    })
  })
})
