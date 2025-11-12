import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { Env } from '../../infrastructure/config/env.js'
import {
  buildAdminUser,
  buildExpiredRefreshToken,
  buildRefreshTokenDTO,
  buildSuperAdminUser,
  buildUser,
  buildValidRefreshToken,
  expectErrorType,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/jwtUtils.js', () => ({
  generateAccessToken: vi.fn(() => TEST_CONSTANTS.AUTH.NEW_ACCESS_TOKEN),
  verifyRefreshToken: vi.fn(),
}))

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let env: Env

  // Mock user data
  const mockUser = buildUser()

  // Mock refresh token (valid, not expired)
  const mockRefreshToken = buildValidRefreshToken()

  // Mock JWT payload
  const mockPayload = {
    tokenId: TEST_CONSTANTS.MOCK_TOKEN_ID,
    userId: TEST_CONSTANTS.USERS.JOHN_DOE.id,
  }

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
    refreshTokenUseCase = RefreshTokenUseCase.create({
      env,
      refreshTokenRepository,
      userRepository,
    })
  })

  describe('execute', () => {
    describe('successful refresh', () => {
      it('should generate new access token with valid refresh token', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.accessToken).toBe(TEST_CONSTANTS.AUTH.NEW_ACCESS_TOKEN)
      })

      it('should verify refresh token JWT signature', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(verifyRefreshToken).toHaveBeenCalledWith(
          TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN,
          env,
        )
        expect(verifyRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should check if refresh token exists in database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith(
          TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN,
        )
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledTimes(1)
      })

      it('should get user from database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.USERS.JOHN_DOE.id)
        expect(userRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should generate new access token with correct payload', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

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
    })

    describe('error cases', () => {
      it('should return ValidationError when JWT signature is invalid', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Invalid token signature')
        })

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid token signature')

        // Should not proceed to database checks
        expect(refreshTokenRepository.findByToken).not.toHaveBeenCalled()
      })

      it('should return ValidationError when refresh token does not exist in database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Refresh token has been revoked')

        // Should not proceed to user check
        expect(userRepository.findById).not.toHaveBeenCalled()
      })

      it('should return ValidationError and delete token when refresh token has expired', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({
          refreshToken: TEST_CONSTANTS.AUTH.EXPIRED_REFRESH_TOKEN,
        })

        // Create expired token
        const expiredToken = buildExpiredRefreshToken()

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(expiredToken)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Refresh token has expired')

        // Should clean up expired token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith(
          TEST_CONSTANTS.AUTH.EXPIRED_REFRESH_TOKEN,
        )
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should return ValidationError and delete token when user no longer exists', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(null) // User deleted

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('User no longer exists')

        // Should clean up orphaned token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith(
          TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN,
        )
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should include field name in ValidationError', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Token expired')
        })

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.field).toBe('refreshToken')
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()

        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue({
          tokenId: TEST_CONSTANTS.MOCK_TOKEN_ID,
          userId: TEST_CONSTANTS.USERS.ADMIN_USER.id,
        })
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(adminUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            email: TEST_CONSTANTS.USERS.ADMIN_USER.email,
            role: TEST_CONSTANTS.USERS.ADMIN_USER.role,
            userId: TEST_CONSTANTS.USERS.ADMIN_USER.id,
          },
          env,
        )
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue({
          tokenId: TEST_CONSTANTS.MOCK_TOKEN_ID,
          userId: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.id,
        })
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(superAdminUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            email: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.email,
            role: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role,
            userId: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.id,
          },
          env,
        )
      })

      it('should not delete token when JWT verification fails', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Malformed JWT')
        })

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert - Should return error but NOT delete token on JWT verification failure
        expectErrorType({ errorType: ValidationError, result })
        expect(refreshTokenRepository.deleteByToken).not.toHaveBeenCalled()
      })
    })
  })
})
