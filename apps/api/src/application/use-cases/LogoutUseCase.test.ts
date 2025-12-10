import { LogoutUseCase } from '@application/use-cases/LogoutUseCase.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import { faker } from '@faker-js/faker'
import { Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase
  let refreshTokenRepository: IRefreshTokenRepository

  beforeEach(() => {
    vi.clearAllMocks()

    refreshTokenRepository = { deleteByToken: vi.fn() } as unknown as IRefreshTokenRepository

    logoutUseCase = LogoutUseCase.create({ refreshTokenRepository })
  })

  describe('execute', () => {
    it('should successfully delete the refresh token', async () => {
      // Arrange
      const token = faker.string.uuid()

      // Mock repository success (deleted = true)
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

      // Act
      const result = await logoutUseCase.execute({ refreshToken: token })

      // Assert
      expectSuccess(result)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token })
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
    })

    it('should return Ok even if token does not exist (Idempotency)', async () => {
      // Arrange
      const token = faker.string.uuid()

      // Mock repository: token not found (deleted = false), but operation succeeded
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(false))

      // Act
      const result = await logoutUseCase.execute({ refreshToken: token })

      // Assert
      // User should receive a "Logout successful" message even if the token no longer exists
      expectSuccess(result)
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token })
    })

    it('should return Ok even if repository fails (Fire and Forget)', async () => {
      // Arrange
      const token = faker.string.uuid()
      const dbError = RepositoryError.forOperation({ message: 'DB Connection died', operation: 'deleteByToken' })

      // Mock repository failure
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Err(dbError))

      // Act
      const result = await logoutUseCase.execute({ refreshToken: token })

      // Assert
      // CRITICAL: Your Use Case defines that it returns Result<void, NEVER>.
      // This means it should never return an error, even if the database fails.
      // The user wants to log out, not see a 500 error because we couldn't delete a token.
      expectSuccess(result)

      // Verify that it at least tried to delete the token
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token })
    })
  })
})
