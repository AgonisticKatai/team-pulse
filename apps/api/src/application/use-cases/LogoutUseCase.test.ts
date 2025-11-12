import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import { expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { LogoutUseCase } from './LogoutUseCase.js'

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase
  let refreshTokenRepository: IRefreshTokenRepository

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock repository
    refreshTokenRepository = {
      deleteByToken: vi.fn(),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
      findByToken: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    logoutUseCase = LogoutUseCase.create({ refreshTokenRepository })
  })

  describe('execute', () => {
    it('should delete refresh token from database', async () => {
      // Arrange
      const refreshToken = TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN

      // Act
      const result = await logoutUseCase.execute(refreshToken)

      // Assert
      expectSuccess(result)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith(refreshToken)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
    })

    it('should complete successfully even if token does not exist', async () => {
      // Arrange
      const refreshToken = 'non-existent-token'
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(false)

      // Act
      const result = await logoutUseCase.execute(refreshToken)

      // Assert
      expectSuccess(result)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith(refreshToken)
    })

    it('should return void (no return value)', async () => {
      // Arrange
      const refreshToken = TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN

      // Act
      const result = await logoutUseCase.execute(refreshToken)

      // Assert
      const value = expectSuccess(result)
      expect(value).toBeUndefined()
    })

    it('should handle empty token string', async () => {
      // Arrange
      const refreshToken = ''

      // Act
      const result = await logoutUseCase.execute(refreshToken)

      // Assert
      expectSuccess(result)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith('')
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple logout attempts with same token', async () => {
      // Arrange
      const refreshToken = TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN

      // Act - Call multiple times
      const result1 = await logoutUseCase.execute(refreshToken)
      const result2 = await logoutUseCase.execute(refreshToken)
      const result3 = await logoutUseCase.execute(refreshToken)

      // Assert - Should be called 3 times (idempotent operation)
      expectSuccess(result1)
      expectSuccess(result2)
      expectSuccess(result3)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(3)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith(refreshToken)
    })
  })
})
