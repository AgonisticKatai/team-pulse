import { Err, Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { buildRefreshTokenDTO } from '@team-pulse/shared/testing/dto-builders'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError, RepositoryError, ValidationError } from '../../domain/errors/index.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import {
  buildAdminUser,
  buildExpiredRefreshToken,
  buildSuperAdminUser,
  buildUser,
  buildValidRefreshToken,
} from '../../infrastructure/testing/index.js'
import type { TokenFactory } from '../factories/TokenFactory.js'
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js'

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let tokenFactory: TokenFactory

  // Mock user data
  const mockUser = buildUser()

  // Mock refresh token (valid, not expired)
  const mockRefreshToken = buildValidRefreshToken()

  // Mock new refresh token for rotation
  const mockNewRefreshToken = buildValidRefreshToken({
    token: TEST_CONSTANTS.auth.newRefreshToken,
  })

  // Mock JWT payload
  const mockPayload = {
    tokenId: TEST_CONSTANTS.mockTokenId,
    userId: TEST_CONSTANTS.users.johnDoe.id,
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock TokenFactory
    tokenFactory = {
      createAccessToken: vi.fn(() => Ok(TEST_CONSTANTS.auth.newAccessToken)),
      createRefreshToken: vi.fn(() => Ok(mockNewRefreshToken)),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(() => Ok(mockPayload)),
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
      deleteByToken: vi.fn(() => Promise.resolve(Ok(true))),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
      findByToken: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(() => Promise.resolve(Ok(mockNewRefreshToken))),
    }

    // Create use case instance
    refreshTokenUseCase = RefreshTokenUseCase.create({
      tokenFactory,
      refreshTokenRepository,
      userRepository,
    })
  })

  describe('execute', () => {
    describe('successful refresh', () => {
      it('should generate new access token and new refresh token (rotation)', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.accessToken).toBe(TEST_CONSTANTS.auth.newAccessToken)
        expect(data.refreshToken).toBe(TEST_CONSTANTS.auth.newRefreshToken)
      })

      it('should verify refresh token JWT signature', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.verifyRefreshToken).toHaveBeenCalledWith({
          token: TEST_CONSTANTS.auth.validRefreshToken,
        })
        expect(tokenFactory.verifyRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should check if refresh token exists in database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith({ token: TEST_CONSTANTS.auth.validRefreshToken })
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledTimes(1)
      })

      it('should get user from database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.findById).toHaveBeenCalledWith({ id: TEST_CONSTANTS.users.johnDoe.id })
        expect(userRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should generate new access token with correct payload', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.johnDoe.email,
          role: TEST_CONSTANTS.users.johnDoe.role,
          userId: TEST_CONSTANTS.users.johnDoe.id,
        })
        expect(tokenFactory.createAccessToken).toHaveBeenCalledTimes(1)
      })
    })

    describe('token rotation', () => {
      it('should generate new refresh token', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledWith({
          userId: TEST_CONSTANTS.users.johnDoe.id,
        })
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should save new refresh token to database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.save).toHaveBeenCalledWith({
          refreshToken: mockNewRefreshToken,
        })
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
      })

      it('should delete old refresh token after generating new one', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({
          token: TEST_CONSTANTS.auth.validRefreshToken,
        })
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should not fail if old token deletion fails', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(
          Err(
            RepositoryError.forOperation({
              cause: new Error('Database error'),
              message: 'Failed to delete old token',
              operation: 'deleteByToken',
            }),
          ),
        )

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert - Should still succeed even if deletion fails
        const data = expectSuccess(result)
        expect(data.accessToken).toBe(TEST_CONSTANTS.auth.newAccessToken)
        expect(data.refreshToken).toBe(TEST_CONSTANTS.auth.newRefreshToken)
      })
    })

    describe('error cases', () => {
      it('should return ValidationError when JWT signature is invalid', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(
            ValidationError.forField({
              field: 'refreshToken',
              message: 'Invalid token signature',
            }),
          ),
        )

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Invalid token signature')

        // Should not proceed to database checks
        expect(refreshTokenRepository.findByToken).not.toHaveBeenCalled()
      })

      it('should return NotFoundError when refresh token does not exist in database', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(null))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('RefreshToken')

        // Should not proceed to user check
        expect(userRepository.findById).not.toHaveBeenCalled()
      })

      it('should return ValidationError and delete token when refresh token has expired', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({
          refreshToken: TEST_CONSTANTS.auth.expiredRefreshToken,
        })

        // Create expired token
        const expiredToken = buildExpiredRefreshToken()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(expiredToken))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('Refresh token has expired')

        // Should clean up expired token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: TEST_CONSTANTS.auth.expiredRefreshToken })
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should return NotFoundError and delete token when user no longer exists', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO({ refreshToken: TEST_CONSTANTS.auth.validRefreshToken })

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(null)) // User deleted
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('User')

        // Should clean up orphaned token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: TEST_CONSTANTS.auth.validRefreshToken })
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should include field name in ValidationError', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(
            ValidationError.forField({
              field: 'refreshToken',
              message: 'Invalid token format',
            }),
          ),
        )

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

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Ok({
            tokenId: TEST_CONSTANTS.mockTokenId,
            userId: TEST_CONSTANTS.users.adminUser.id,
          }),
        )
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(adminUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.adminUser.email,
          role: TEST_CONSTANTS.users.adminUser.role,
          userId: TEST_CONSTANTS.users.adminUser.id,
        })
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Ok({
            tokenId: TEST_CONSTANTS.mockTokenId,
            userId: TEST_CONSTANTS.users.superAdminUser.id,
          }),
        )
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshToken))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(superAdminUser))

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.superAdminUser.email,
          role: TEST_CONSTANTS.users.superAdminUser.role,
          userId: TEST_CONSTANTS.users.superAdminUser.id,
        })
      })

      it('should not delete token when JWT verification fails', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(
            ValidationError.forField({
              field: 'refreshToken',
              message: 'Invalid access token',
            }),
          ),
        )

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert - Should return error but NOT delete token on JWT verification failure
        expectErrorType({ errorType: ValidationError, result })
        expect(refreshTokenRepository.deleteByToken).not.toHaveBeenCalled()
      })
    })
  })
})
