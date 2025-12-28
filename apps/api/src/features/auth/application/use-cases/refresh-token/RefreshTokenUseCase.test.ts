import { faker } from '@faker-js/faker'
import type { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import { RefreshTokenUseCase } from '@features/auth/application/use-cases/refresh-token/RefreshTokenUseCase.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import {
  buildAdminUser,
  buildExpiredRefreshToken,
  buildSuperAdminUser,
  buildUser,
  buildValidRefreshToken,
} from '@shared/testing/index.js'
import type { RefreshTokenDTO } from '@team-pulse/shared'
import { AuthenticationError, Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let tokenFactory: TokenFactory

  // 1. DATA SETUP
  const mockUser = buildUser()
  const mockRefreshTokenEntity = buildValidRefreshToken({ userId: mockUser.id })
  const mockNewRefreshTokenEntity = buildValidRefreshToken({ userId: mockUser.id })
  const mockNewAccessToken = faker.string.uuid()
  const mockPayload = { tokenId: mockRefreshTokenEntity.id, userId: mockUser.id }

  beforeEach(() => {
    vi.clearAllMocks()

    tokenFactory = {
      createAccessToken: vi.fn(),
      createRefreshToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    } as unknown as TokenFactory

    userRepository = { findById: vi.fn() } as unknown as IUserRepository

    refreshTokenRepository = {
      deleteByToken: vi.fn(),
      findByToken: vi.fn(),
      save: vi.fn(),
    } as unknown as IRefreshTokenRepository

    refreshTokenUseCase = RefreshTokenUseCase.create({ refreshTokenRepository, tokenFactory, userRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should generate new access token and new refresh token (rotation)', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(mockNewAccessToken))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        const data = expectSuccess(result)
        expect(data.accessToken).toBe(mockNewAccessToken)
        expect(data.refreshToken).toBe(mockNewRefreshTokenEntity.token)

        // Verify Flow
        expect(tokenFactory.verifyRefreshToken).toHaveBeenCalledWith({ token: dto.refreshToken })
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
        expect(userRepository.findById).toHaveBeenCalledWith({ id: mockUser.id })
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: mockUser.email,
          role: mockUser.role,
          userId: mockUser.id,
        })
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledWith({ userId: mockUser.id })
        expect(refreshTokenRepository.save).toHaveBeenCalledWith({ refreshToken: mockNewRefreshTokenEntity })
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })
    })

    // -------------------------------------------------------------------------
    // ❌ VALIDATION ERRORS (Security)
    // -------------------------------------------------------------------------
    describe('Validation & Security Errors', () => {
      it('should return AuthenticationError when JWT signature is invalid', async () => {
        // Arrange
        const dto = { refreshToken: 'invalid.token' } satisfies RefreshTokenDTO

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(
            AuthenticationError.create({
              message: 'Invalid token signature',
              metadata: { field: 'refreshToken', reason: 'invalid_signature' },
            }),
          ),
        )

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError when Token Identity (JTI) does not match Database ID', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const storedEntity = buildValidRefreshToken({ userId: mockUser.id })
        // Malicious or mismatched payload ID
        const maliciousPayloadId = buildValidRefreshToken().id

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Ok({ tokenId: maliciousPayloadId, userId: mockUser.id }),
        )
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(storedEntity))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError when refresh token does not exist in database', async () => {
        // Arrange
        const dto = { refreshToken: 'not.found.token' } satisfies RefreshTokenDTO

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(null))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError and delete token when refresh token has expired', async () => {
        // Arrange
        const dto = { refreshToken: 'expired.token' } satisfies RefreshTokenDTO
        const expiredTokenEntity = buildExpiredRefreshToken()
        const expiredPayload = { tokenId: expiredTokenEntity.id, userId: mockUser.id }

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(expiredPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(expiredTokenEntity))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
        // Reuse detection / Cleanup
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })

      it('should return AuthenticationError and delete token when user no longer exists', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(null))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when findByToken fails', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const dbError = RepositoryError.forOperation({ message: 'DB Connection failed', operation: 'findByToken' })

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Err(dbError))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe('DB Connection failed')
      })

      it('should return RepositoryError when user lookup fails and delete old token', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const dbError = RepositoryError.forOperation({ message: 'User lookup failed', operation: 'findById' })

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Err(dbError))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe('User lookup failed')
        // Security: Delete token when user lookup fails
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })

      it('should return RepositoryError when saving new refresh token fails', async () => {
        // Arrange
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const dbError = RepositoryError.forOperation({ message: 'Save failed', operation: 'save' })

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(mockNewAccessToken))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Err(dbError))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe('Save failed')
      })
    })

    // -------------------------------------------------------------------------
    // 🧪 EDGE CASES
    // -------------------------------------------------------------------------
    describe('Edge Cases', () => {
      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const payload = { tokenId: mockRefreshTokenEntity.id, userId: superAdminUser.id }

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(payload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(superAdminUser))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(mockNewAccessToken))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: superAdminUser.email,
          role: superAdminUser.role,
          userId: superAdminUser.id,
        })
      })

      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()
        const dto = { refreshToken: mockRefreshTokenEntity.token } satisfies RefreshTokenDTO
        const payload = { tokenId: mockRefreshTokenEntity.id, userId: adminUser.id }

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(payload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(adminUser))
        vi.mocked(tokenFactory.createRefreshToken).mockReturnValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(refreshTokenRepository.save).mockResolvedValue(Ok(mockNewRefreshTokenEntity))
        vi.mocked(tokenFactory.createAccessToken).mockReturnValue(Ok(mockNewAccessToken))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({
          email: adminUser.email,
          role: adminUser.role,
          userId: adminUser.id,
        })
      })

      it('should not delete token when JWT verification fails (brute force protection)', async () => {
        // Arrange
        const dto = { refreshToken: 'garbage.token' } satisfies RefreshTokenDTO

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(
            AuthenticationError.create({
              message: 'Invalid access token',
              metadata: { field: 'refreshToken', reason: 'invalid_token' },
            }),
          ),
        )

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
        expect(refreshTokenRepository.deleteByToken).not.toHaveBeenCalled()
      })
    })
  })
})
