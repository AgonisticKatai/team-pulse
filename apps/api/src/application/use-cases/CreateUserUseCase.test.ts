import type { CreateUserDTO } from '@team-pulse/shared'
import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { User } from '../../domain/models/User.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { expectSuccess } from '../../infrastructure/testing/result-helpers.js'
import { CreateUserUseCase } from './CreateUserUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/passwordUtils.js', () => ({
  hashPassword: vi.fn(() => Promise.resolve('hashed-password')),
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid'),
}))

// Helper to create user from persistence and unwrap Result
function createUser(data: Parameters<typeof User.create>[0]): User {
  return expectSuccess(User.create(data))
}

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository

  // Mock user data
  const mockUser = createUser({
    createdAt: new Date('2025-01-01T00:00:00Z'),
    email: 'newuser@example.com',
    id: 'mock-uuid',
    passwordHash: 'hashed-password',
    role: 'USER',
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  })

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock repository
    userRepository = {
      count: vi.fn(),
      delete: vi.fn(),
      existsByEmail: vi.fn(),
      findAll: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    createUserUseCase = new CreateUserUseCase(userRepository)
  })

  describe('execute', () => {
    describe('successful user creation', () => {
      it('should create user with valid data', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expect(result).toBeDefined()
        expect(result.id).toBe('mock-uuid')
        expect(result.email).toBe('newuser@example.com')
        expect(result.role).toBe('USER')
      })

      it('should check if email already exists', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        await createUserUseCase.execute(dto)

        // Assert
        expect(userRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com')
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should hash password before saving', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        const { hashPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        await createUserUseCase.execute(dto)

        // Assert
        expect(hashPassword).toHaveBeenCalledWith('ValidPass123')
        expect(hashPassword).toHaveBeenCalledTimes(1)
      })

      it('should save user with hashed password', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        await createUserUseCase.execute(dto)

        // Assert
        expect(userRepository.save).toHaveBeenCalledTimes(1)
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser.email.getValue()).toBe('newuser@example.com')
        expect(savedUser.getPasswordHash()).toBe('hashed-password')
        expect(savedUser.role.getValue()).toBe('USER')
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expect(result).not.toHaveProperty('passwordHash')
        expect(result).toEqual({
          createdAt: '2025-01-01T00:00:00.000Z',
          email: 'newuser@example.com',
          id: 'mock-uuid',
          role: 'USER',
          updatedAt: '2025-01-01T00:00:00.000Z',
        })
      })

      it('should convert dates to ISO strings in response', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expect(typeof result.createdAt).toBe('string')
        expect(typeof result.updatedAt).toBe('string')
        expect(result.createdAt).toBe('2025-01-01T00:00:00.000Z')
        expect(result.updatedAt).toBe('2025-01-01T00:00:00.000Z')
      })
    })

    describe('error cases', () => {
      it('should throw ValidationError when email already exists', async () => {
        // Arrange
        const existingUser = expectSuccess(
          User.create({
            createdAt: new Date(),
            email: 'existing@example.com',
            id: 'existing-123',
            passwordHash: 'hashed',
            role: 'USER',
            updatedAt: new Date(),
          }),
        )

        const dto: CreateUserDTO = {
          email: 'existing@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser!)

        // Act
        let error: ValidationError | undefined
        try {
          await createUserUseCase.execute(dto)
        } catch (err) {
          error = err as ValidationError
        }

        // Assert
        expect(error).toBeInstanceOf(ValidationError)
        expect(error).toBeDefined()
        expect(error?.message).toBe('A user with email "existing@example.com" already exists')
        expect(error?.field).toBe('email')
      })

      it('should not hash password when email already exists', async () => {
        // Arrange
        const existingUser = expectSuccess(
          User.create({
            createdAt: new Date(),
            email: 'existing@example.com',
            id: 'existing-123',
            passwordHash: 'hashed',
            role: 'USER',
            updatedAt: new Date(),
          }),
        )

        const dto: CreateUserDTO = {
          email: 'existing@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser!)

        const { hashPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        try {
          await createUserUseCase.execute(dto)
        } catch {
          // Expected error
        }

        // Assert - Should fail before hashing password
        expect(hashPassword).not.toHaveBeenCalled()
        expect(userRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = expectSuccess(
          User.create({
            createdAt: new Date('2025-01-01T00:00:00Z'),
            email: 'admin@example.com',
            id: 'mock-uuid',
            passwordHash: 'hashed-password',
            role: 'ADMIN',
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          }),
        )

        const dto: CreateUserDTO = {
          email: 'admin@example.com',
          password: 'AdminPass123',
          role: 'ADMIN',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(adminUser!)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expect(result.role).toBe('ADMIN')
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe('ADMIN')
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = expectSuccess(
          User.create({
            createdAt: new Date('2025-01-01T00:00:00Z'),
            email: 'superadmin@example.com',
            id: 'mock-uuid',
            passwordHash: 'hashed-password',
            role: 'SUPER_ADMIN',
            updatedAt: new Date('2025-01-01T00:00:00Z'),
          }),
        )

        const dto: CreateUserDTO = {
          email: 'superadmin@example.com',
          password: 'SuperPass123',
          role: 'SUPER_ADMIN',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(superAdminUser!)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expect(result.role).toBe('SUPER_ADMIN')
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe('SUPER_ADMIN')
      })

      it('should generate UUID for new user', async () => {
        // Arrange
        const dto: CreateUserDTO = {
          email: 'newuser@example.com',
          password: 'ValidPass123',
          role: 'USER',
        }

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        const { randomUUID } = await import('node:crypto')

        // Act
        await createUserUseCase.execute(dto)

        // Assert
        expect(randomUUID).toHaveBeenCalled()
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.id.getValue()).toBe('mock-uuid')
      })
    })
  })
})
