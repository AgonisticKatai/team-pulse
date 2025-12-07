import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { RefreshTokenUseCase } from '@application/use-cases/RefreshTokenUseCase.js'
import type { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import { faker } from '@faker-js/faker'
import { buildAdminUser, buildExpiredRefreshToken, buildSuperAdminUser, buildUser, buildValidRefreshToken } from '@infrastructure/testing/index.js'
import { IdUtils, type RefreshTokenId } from '@team-pulse/shared/domain/ids'
import { AuthenticationError, RepositoryError } from '@team-pulse/shared/errors'
import { Err, Ok } from '@team-pulse/shared/result'
import { buildRefreshTokenDTO } from '@team-pulse/shared/testing/dto-builders'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let tokenFactory: TokenFactory

  // 1. DATA SETUP (Dynamic but consistent for the suite)
  // -------------------------------------------------------

  // Standard user for general tests
  const mockUser = buildUser()

  // Existing valid RefreshToken in DB
  const mockRefreshTokenEntity = buildValidRefreshToken({ userId: mockUser.id })

  // New RefreshToken that will be generated after rotation
  const mockNewRefreshTokenEntity = buildValidRefreshToken({ userId: mockUser.id })

  // New AccessToken that will be generated after rotation
  const mockNewAccessToken = faker.string.uuid()

  // Payload that returns the JWT when verified
  // IMPORTANT: Matches the ID of the mockRefreshTokenEntity entity
  const mockPayload = { tokenId: mockRefreshTokenEntity.id, userId: mockUser.id }

  beforeEach(() => {
    vi.clearAllMocks()

    tokenFactory = {
      createAccessToken: vi.fn(() => Ok(mockNewAccessToken)),
      createRefreshToken: vi.fn(() => Ok(mockNewRefreshTokenEntity)),
      verifyRefreshToken: vi.fn(() => Ok(mockPayload)),
    } as unknown as TokenFactory

    userRepository = { findById: vi.fn() } as unknown as IUserRepository

    refreshTokenRepository = {
      deleteByToken: vi.fn(() => Promise.resolve(Ok(true))),
      findByToken: vi.fn(),
      save: vi.fn(() => Promise.resolve(Ok(mockNewRefreshTokenEntity))),
    } as unknown as IRefreshTokenRepository

    refreshTokenUseCase = RefreshTokenUseCase.create({ refreshTokenRepository, tokenFactory, userRepository })
  })

  describe('execute', () => {
    describe('successful refresh', () => {
      it('should generate new access token and new refresh token (rotation)', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        const data = expectSuccess(result)
        expect(data.accessToken).toBe(mockNewAccessToken)
        expect(data.refreshToken).toBe(mockNewRefreshTokenEntity.token)
      })

      it('should verify refresh token JWT signature', async () => {
        const dto = buildRefreshTokenDTO()
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(tokenFactory.verifyRefreshToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })

      it('should check if refresh token exists in database', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })

      it('should get user from database', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        // Verify that it called findById with the ID that we passed in the DTO
        expect(userRepository.findById).toHaveBeenCalledWith({ id: mockUser.id })
      })

      it('should generate new access token with correct payload', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(tokenFactory.createAccessToken).toHaveBeenCalledWith({ email: mockUser.email, role: mockUser.role, userId: mockUser.id })
      })
    })

    describe('token rotation', () => {
      it('should generate new refresh token', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(tokenFactory.createRefreshToken).toHaveBeenCalledWith({ userId: mockUser.id })
      })

      it('should save new refresh token to database', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(refreshTokenRepository.save).toHaveBeenCalledWith({ refreshToken: mockNewRefreshTokenEntity })
      })

      it('should delete old refresh token after generating new one', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))

        const result = await refreshTokenUseCase.execute({ dto })

        expectSuccess(result)
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith({ token: dto.refreshToken })
      })

      it('should not fail if old token deletion fails', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(mockUser))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(
          Err(
            RepositoryError.forOperation({ cause: new Error('Database error'), message: 'Failed to delete old token', operation: 'deleteByToken' }),
          ),
        )

        const result = await refreshTokenUseCase.execute({ dto })

        const data = expectSuccess(result)
        expect(data.accessToken).toBe(mockNewAccessToken)
      })
    })

    describe('error cases', () => {
      it('should return AuthenticationError when Token Identity (JTI) does not match Database ID', async () => {
        // Arrange
        const dto = buildRefreshTokenDTO()

        // 1. DB returns a token with ID "A"
        const storedEntity = buildValidRefreshToken({ userId: mockUser.id })

        // 2. JWT says its ID is "B" (Different)
        const maliciousPayloadId = IdUtils.generate<RefreshTokenId>()

        // Ensure they are different for the test
        expect(storedEntity.id).not.toBe(maliciousPayloadId)

        // Mocks
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(storedEntity))
        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok({ tokenId: maliciousPayloadId, userId: mockUser.id }))

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError when JWT signature is invalid', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(AuthenticationError.create({ message: 'Invalid token signature', metadata: { field: 'refreshToken', reason: 'invalid_signature' } })),
        )

        const result = await refreshTokenUseCase.execute({ dto })

        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError when refresh token does not exist in database', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(null))

        const result = await refreshTokenUseCase.execute({ dto })

        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError and delete token when refresh token has expired', async () => {
        const dto = buildRefreshTokenDTO()
        const expiredTokenEntity = buildExpiredRefreshToken()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(expiredTokenEntity))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        const result = await refreshTokenUseCase.execute({ dto })

        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should return AuthenticationError and delete token when user no longer exists', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok(mockPayload))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(null))
        vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue(Ok(true))

        const result = await refreshTokenUseCase.execute({ dto })

        expectErrorType({ errorType: AuthenticationError, result })
      })

      it('should include field name in AuthenticationError metadata', async () => {
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(AuthenticationError.create({ message: 'Invalid token format', metadata: { field: 'refreshToken', reason: 'invalid_format' } })),
        )

        const result = await refreshTokenUseCase.execute({ dto })

        expectErrorType({ errorType: AuthenticationError, result })
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        const adminUser = buildAdminUser()
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok({ tokenId: mockRefreshTokenEntity.id, userId: adminUser.id }))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(adminUser))

        const result = await refreshTokenUseCase.execute({ dto })
        expectSuccess(result)
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()
        const dto = buildRefreshTokenDTO()

        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(Ok({ tokenId: mockRefreshTokenEntity.id, userId: superAdminUser.id }))
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(Ok(mockRefreshTokenEntity))
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(superAdminUser))

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

      it('should not delete token when JWT verification fails', async () => {
        const dto = buildRefreshTokenDTO()

        // Simulate signature failure (JWT invalid, logically not expired)
        vi.mocked(tokenFactory.verifyRefreshToken).mockReturnValue(
          Err(AuthenticationError.create({ message: 'Invalid access token', metadata: { field: 'refreshToken', reason: 'invalid_token' } })),
        )

        // Act
        const result = await refreshTokenUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: AuthenticationError, result })
        // IMPORTANT: Do not delete if the token is not even valid cryptographically
        // (it could be a brute force attack with garbage)
        expect(refreshTokenRepository.deleteByToken).not.toHaveBeenCalled()
      })
    })
  })
})
