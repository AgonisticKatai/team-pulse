import type { RefreshTokenDTO } from '@team-pulse/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import { User } from '../../domain/models/User.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { Env } from '../../infrastructure/config/env.js'
import { RefreshTokenUseCase } from './RefreshTokenUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/jwtUtils.js', () => ({
  verifyRefreshToken: vi.fn(),
  generateAccessToken: vi.fn(() => 'new-access-token'),
}))

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let env: Env

  // Mock user data
  const mockUser = User.fromPersistence({
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'USER',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-15T12:00:00Z'),
  })

  // Mock refresh token (valid, not expired)
  const mockRefreshToken = RefreshToken.fromPersistence({
    id: 'token-123',
    token: 'valid-refresh-token',
    userId: 'user-123',
    expiresAt: new Date('2025-12-31T23:59:59Z'), // Future date
    createdAt: new Date('2025-01-01T00:00:00Z'),
  })

  // Mock JWT payload
  const mockPayload = {
    userId: 'user-123',
    tokenId: 'token-123',
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock environment
    env = {
      NODE_ENV: 'test',
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long',
      FRONTEND_URL: 'http://localhost:5173',
    }

    // Mock repositories
    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      count: vi.fn(),
    }

    refreshTokenRepository = {
      save: vi.fn(),
      findByToken: vi.fn(),
      findByUserId: vi.fn(),
      deleteByToken: vi.fn(),
      deleteByUserId: vi.fn(),
      deleteExpired: vi.fn(),
    }

    // Create use case instance
    refreshTokenUseCase = new RefreshTokenUseCase(userRepository, refreshTokenRepository, env)
  })

  describe('execute', () => {
    describe('successful refresh', () => {
      it('should generate new access token with valid refresh token', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        const result = await refreshTokenUseCase.execute(dto)

        // Assert
        expect(result).toBeDefined()
        expect(result.accessToken).toBe('new-access-token')
      })

      it('should verify refresh token JWT signature', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token', env)
        expect(verifyRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should check if refresh token exists in database', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledWith('valid-refresh-token')
        expect(refreshTokenRepository.findByToken).toHaveBeenCalledTimes(1)
      })

      it('should get user from database', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(userRepository.findById).toHaveBeenCalledWith('user-123')
        expect(userRepository.findById).toHaveBeenCalledTimes(1)
      })

      it('should generate new access token with correct payload', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'USER',
          },
          env,
        )
        expect(generateAccessToken).toHaveBeenCalledTimes(1)
      })
    })

    describe('error cases', () => {
      it('should throw ValidationError when JWT signature is invalid', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'invalid-jwt-signature',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Invalid token signature')
        })

        // Act & Assert
        await expect(refreshTokenUseCase.execute(dto)).rejects.toThrow(ValidationError)
        await expect(refreshTokenUseCase.execute(dto)).rejects.toThrow('Invalid token signature')

        // Should not proceed to database checks
        expect(refreshTokenRepository.findByToken).not.toHaveBeenCalled()
      })

      it('should throw ValidationError when refresh token does not exist in database', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'revoked-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null)

        // Act & Assert
        await expect(refreshTokenUseCase.execute(dto)).rejects.toThrow(ValidationError)
        await expect(refreshTokenUseCase.execute(dto)).rejects.toThrow(
          'Refresh token has been revoked',
        )

        // Should not proceed to user check
        expect(userRepository.findById).not.toHaveBeenCalled()
      })

      it('should throw ValidationError and delete token when refresh token has expired', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'expired-token',
        }

        // Create expired token
        const expiredToken = RefreshToken.fromPersistence({
          id: 'token-123',
          token: 'expired-token',
          userId: 'user-123',
          expiresAt: new Date('2020-01-01T00:00:00Z'), // Past date
          createdAt: new Date('2019-01-01T00:00:00Z'),
        })

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(expiredToken)

        // Act
        let error: ValidationError | undefined
        try {
          await refreshTokenUseCase.execute(dto)
        } catch (err) {
          error = err as ValidationError
        }

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(error).toBeDefined()
        expect(error?.message).toBe('Refresh token has expired')

        // Should clean up expired token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith('expired-token')
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should throw ValidationError and delete token when user no longer exists', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'valid-refresh-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(null) // User deleted

        // Act
        let error: ValidationError | undefined
        try {
          await refreshTokenUseCase.execute(dto)
        } catch (err) {
          error = err as ValidationError
        }

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(error).toBeDefined()
        expect(error?.message).toBe('User no longer exists')

        // Should clean up orphaned token
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith('valid-refresh-token')
        expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledTimes(1)
      })

      it('should include field name in ValidationError', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'invalid-token',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Token expired')
        })

        // Act
        let error: ValidationError | undefined
        try {
          await refreshTokenUseCase.execute(dto)
        } catch (err) {
          error = err as ValidationError
        }

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(error).toBeDefined()
        expect(error?.field).toBe('refreshToken')
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = User.fromPersistence({
          id: 'admin-123',
          email: 'admin@example.com',
          passwordHash: 'hashed-password',
          role: 'ADMIN',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const dto: RefreshTokenDTO = {
          refreshToken: 'admin-refresh-token',
        }

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue({ userId: 'admin-123', tokenId: 'token-123' })
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(adminUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            userId: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
          env,
        )
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = User.fromPersistence({
          id: 'super-admin-123',
          email: 'superadmin@example.com',
          passwordHash: 'hashed-password',
          role: 'SUPER_ADMIN',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const dto: RefreshTokenDTO = {
          refreshToken: 'superadmin-refresh-token',
        }

        const { verifyRefreshToken, generateAccessToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )
        vi.mocked(verifyRefreshToken).mockReturnValue({
          userId: 'super-admin-123',
          tokenId: 'token-123',
        })
        vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(mockRefreshToken)
        vi.mocked(userRepository.findById).mockResolvedValue(superAdminUser)

        // Act
        await refreshTokenUseCase.execute(dto)

        // Assert
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            userId: 'super-admin-123',
            email: 'superadmin@example.com',
            role: 'SUPER_ADMIN',
          },
          env,
        )
      })

      it('should not delete token when JWT verification fails', async () => {
        // Arrange
        const dto: RefreshTokenDTO = {
          refreshToken: 'malformed-jwt',
        }

        const { verifyRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')
        vi.mocked(verifyRefreshToken).mockImplementation(() => {
          throw new Error('Malformed JWT')
        })

        // Act
        try {
          await refreshTokenUseCase.execute(dto)
        } catch {
          // Expected error
        }

        // Assert - Should NOT delete token on JWT verification failure
        expect(refreshTokenRepository.deleteByToken).not.toHaveBeenCalled()
      })
    })
  })
})
