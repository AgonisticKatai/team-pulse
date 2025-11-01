import type { LoginDTO } from '@team-pulse/shared'
import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import { User } from '../../domain/models/User.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import type { Env } from '../../infrastructure/config/env.js'
import { LoginUseCase } from './LoginUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/jwtUtils.js', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  getRefreshTokenExpirationDate: vi.fn(() => new Date('2025-12-31T23:59:59Z')),
}))

vi.mock('../../infrastructure/auth/passwordUtils.js', () => ({
  verifyPassword: vi.fn(),
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid'),
}))

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let userRepository: IUserRepository
  let refreshTokenRepository: IRefreshTokenRepository
  let env: Env

  // Mock user data (using fromPersistence to control dates in tests)
  const mockUser = User.fromPersistence({
    createdAt: new Date('2025-01-01T00:00:00Z'),
    email: 'test@example.com',
    id: 'user-123',
    passwordHash: 'hashed-password',
    role: 'USER',
    updatedAt: new Date('2025-01-15T12:00:00Z'),
  })

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock environment (only JWT secrets are used by LoginUseCase)
    env = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      FRONTEND_URL: 'http://localhost:5173',
      HOST: '0.0.0.0',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long',
      JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
      LOG_LEVEL: 'info',
      NODE_ENV: 'test',
      PORT: 3000,
    }

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
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expect(result).toBeDefined()
        expect(result.accessToken).toBe('mock-access-token')
        expect(result.refreshToken).toBe('mock-refresh-token')
        expect(result.user).toEqual({
          createdAt: '2025-01-01T00:00:00.000Z',
          email: 'test@example.com',
          id: 'user-123',
          role: 'USER',
          updatedAt: '2025-01-15T12:00:00.000Z',
        })
      })

      it('should call userRepository.findByEmail with correct email', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        await loginUseCase.execute(loginDTO)

        // Assert
        expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com')
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should verify password with user password hash', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        await loginUseCase.execute(loginDTO)

        // Assert
        expect(verifyPassword).toHaveBeenCalledWith('ValidPass123', 'hashed-password')
        expect(verifyPassword).toHaveBeenCalledTimes(1)
      })

      it('should generate access token with correct payload', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        const { generateAccessToken } = await import('../../infrastructure/auth/jwtUtils.js')

        // Act
        await loginUseCase.execute(loginDTO)

        // Assert
        expect(generateAccessToken).toHaveBeenCalledWith(
          {
            email: 'test@example.com',
            role: 'USER',
            userId: 'user-123',
          },
          env,
        )
        expect(generateAccessToken).toHaveBeenCalledTimes(1)
      })

      it('should generate refresh token with correct payload', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        const { generateRefreshToken } = await import('../../infrastructure/auth/jwtUtils.js')

        // Act
        await loginUseCase.execute(loginDTO)

        // Assert
        expect(generateRefreshToken).toHaveBeenCalledWith(
          {
            tokenId: 'mock-uuid',
            userId: 'user-123',
          },
          env,
        )
        expect(generateRefreshToken).toHaveBeenCalledTimes(1)
      })

      it('should save refresh token to repository', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        await loginUseCase.execute(loginDTO)

        // Assert
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
        const savedToken = expectMockCallArg<RefreshToken>(vi.mocked(refreshTokenRepository.save))
        expect(savedToken).toBeInstanceOf(RefreshToken)
        expect(savedToken.id).toBe('mock-uuid')
        expect(savedToken.token).toBe('mock-refresh-token')
        expect(savedToken.userId).toBe('user-123')
        expect(savedToken.expiresAt).toEqual(new Date('2025-12-31T23:59:59Z'))
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expect(result.user).not.toHaveProperty('passwordHash')
        expect(result.user).toEqual({
          createdAt: '2025-01-01T00:00:00.000Z',
          email: 'test@example.com',
          id: 'user-123',
          role: 'USER',
          updatedAt: '2025-01-15T12:00:00.000Z',
        })
      })
    })

    describe('error cases', () => {
      it('should throw ValidationError when user does not exist', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'nonexistent@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

        // Act & Assert
        await expect(loginUseCase.execute(loginDTO)).rejects.toThrow(ValidationError)
        await expect(loginUseCase.execute(loginDTO)).rejects.toThrow('Invalid email or password')
      })

      it('should not verify password when user does not exist', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'nonexistent@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        try {
          await loginUseCase.execute(loginDTO)
        } catch {
          // Expected error
        }

        // Assert
        expect(verifyPassword).not.toHaveBeenCalled()
      })

      it('should throw ValidationError when password is incorrect', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'WrongPassword123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        // Act & Assert
        await expect(loginUseCase.execute(loginDTO)).rejects.toThrow(ValidationError)
        await expect(loginUseCase.execute(loginDTO)).rejects.toThrow('Invalid email or password')
      })

      it('should not generate tokens when password is incorrect', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'WrongPassword123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        const { generateAccessToken, generateRefreshToken } = await import(
          '../../infrastructure/auth/jwtUtils.js'
        )

        // Act
        try {
          await loginUseCase.execute(loginDTO)
        } catch {
          // Expected error
        }

        // Assert
        expect(generateAccessToken).not.toHaveBeenCalled()
        expect(generateRefreshToken).not.toHaveBeenCalled()
        expect(refreshTokenRepository.save).not.toHaveBeenCalled()
      })

      it('should use generic error message to avoid user enumeration', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'WrongPassword123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(false)

        // Act
        let error: ValidationError | undefined
        try {
          await loginUseCase.execute(loginDTO)
        } catch (err) {
          error = err as ValidationError
        }

        // Assert - Error message should be the same for "user not found" and "wrong password"
        expect(error).toBeInstanceOf(ValidationError)
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid email or password')
        expect(error?.field).toBe('credentials')
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = User.fromPersistence({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'admin@example.com',
          id: 'admin-123',
          passwordHash: 'hashed-password',
          role: 'ADMIN',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const loginDTO: LoginDTO = {
          email: 'admin@example.com',
          password: 'AdminPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(adminUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expect(result.user.role).toBe('ADMIN')
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = User.fromPersistence({
          createdAt: new Date('2025-01-01T00:00:00Z'),
          email: 'superadmin@example.com',
          id: 'super-admin-123',
          passwordHash: 'hashed-password',
          role: 'SUPER_ADMIN',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const loginDTO: LoginDTO = {
          email: 'superadmin@example.com',
          password: 'SuperPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(superAdminUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expect(result.user.role).toBe('SUPER_ADMIN')
      })

      it('should convert dates to ISO strings in user DTO', async () => {
        // Arrange
        const loginDTO: LoginDTO = {
          email: 'test@example.com',
          password: 'ValidPass123',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)
        const { verifyPassword } = await import('../../infrastructure/auth/passwordUtils.js')
        vi.mocked(verifyPassword).mockResolvedValue(true)

        // Act
        const result = await loginUseCase.execute(loginDTO)

        // Assert
        expect(typeof result.user.createdAt).toBe('string')
        expect(typeof result.user.updatedAt).toBe('string')
        expect(result.user.createdAt).toBe('2025-01-01T00:00:00.000Z')
        expect(result.user.updatedAt).toBe('2025-01-15T12:00:00.000Z')
      })
    })
  })
})
