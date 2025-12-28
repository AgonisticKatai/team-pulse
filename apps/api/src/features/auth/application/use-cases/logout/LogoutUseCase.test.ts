import { faker } from '@faker-js/faker'
import { LogoutUseCase } from '@features/auth/application/use-cases/logout/LogoutUseCase.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
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
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should successfully delete the refresh token', async () => {
        // Arrange
        const token = faker.string.uuid()
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
        // Mock token not found
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(false))

        // Act
        const result = await logoutUseCase.execute({ refreshToken: token })

        // Assert
        expectSuccess(result)
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token })
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors (Handled Gracefully)', () => {
      it('should return Ok even if repository fails (Fire and Forget)', async () => {
        // Arrange
        const token = faker.string.uuid()
        const dbError = RepositoryError.forOperation({ message: 'DB Connection died', operation: 'deleteByToken' })

        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Err(dbError))

        // Act
        const result = await logoutUseCase.execute({ refreshToken: token })

        // Assert
        // Best effort logout - always succeeds from client perspective
        expectSuccess(result)
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token })
      })
    })
  })
})
