import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ValidationError } from '../../domain/errors/index.js'
import { User } from '../../domain/models/User.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import {
  buildAdminUser,
  buildCreateUserDTO,
  buildExistingUser,
  buildSuperAdminUser,
  buildUser,
  expectErrorType,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { CreateUserUseCase } from './CreateUserUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/passwordUtils.js', () => ({
  hashPassword: vi.fn(() => Promise.resolve(TEST_CONSTANTS.USERS.JOHN_DOE.passwordHash)),
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.MOCK_UUID),
}))

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository

  // Mock user data - represents a newly created user with generated UUID
  const mockUser = buildUser({ id: TEST_CONSTANTS.MOCK_UUID })

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
    createUserUseCase = CreateUserUseCase.create({ userRepository })
  })

  describe('execute', () => {
    describe('successful user creation', () => {
      it('should create user with valid data', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.id).toBe(TEST_CONSTANTS.MOCK_UUID)
        expect(data.email).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.email)
        expect(data.role).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.role)
      })

      it('should check if email already exists', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).toHaveBeenCalledWith(TEST_CONSTANTS.USERS.JOHN_DOE.email)
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should hash password before saving', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        const { hashPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(hashPassword).toHaveBeenCalledWith(TEST_CONSTANTS.USERS.JOHN_DOE.password)
        expect(hashPassword).toHaveBeenCalledTimes(1)
      })

      it('should save user with hashed password', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.save).toHaveBeenCalledTimes(1)
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser.email.getValue()).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.email)
        expect(savedUser.getPasswordHash()).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.passwordHash)
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.USERS.JOHN_DOE.role)
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).not.toHaveProperty('passwordHash')
        expect(data).toEqual({
          createdAt: TEST_CONSTANTS.MOCK_DATE_ISO,
          email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
          id: TEST_CONSTANTS.MOCK_UUID,
          role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
          updatedAt: TEST_CONSTANTS.MOCK_DATE_ISO,
        })
      })

      it('should convert dates to ISO strings in response', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(typeof data.createdAt).toBe('string')
        expect(typeof data.updatedAt).toBe('string')
        expect(data.createdAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
        expect(data.updatedAt).toBe(TEST_CONSTANTS.MOCK_DATE_ISO)
      })
    })

    describe('error cases', () => {
      it('should return ValidationError when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: 'existing@example.com' })

        const dto = buildCreateUserDTO({ email: 'existing@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ValidationError, result })
        expect(error.message).toBe('A user with email "existing@example.com" already exists')
        expect(error.field).toBe('email')
      })

      it('should not hash password when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: 'existing@example.com' })

        const dto = buildCreateUserDTO({ email: 'existing@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser)

        const { hashPassword } = await import('../../infrastructure/auth/passwordUtils.js')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert - Should fail before hashing password
        expectErrorType({ errorType: ValidationError, result })
        expect(hashPassword).not.toHaveBeenCalled()
        expect(userRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()

        const dto = buildCreateUserDTO({
          email: TEST_CONSTANTS.USERS.ADMIN_USER.email,
          password: TEST_CONSTANTS.USERS.ADMIN_USER.password,
          role: TEST_CONSTANTS.USERS.ADMIN_USER.role,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(adminUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(TEST_CONSTANTS.USERS.ADMIN_USER.role)
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.USERS.ADMIN_USER.role)
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const dto = buildCreateUserDTO({
          email: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.email,
          password: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.password,
          role: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(superAdminUser)

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role)
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role)
      })

      it('should generate UUID for new user', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
        vi.mocked(userRepository.save).mockResolvedValue(mockUser)

        const { randomUUID } = await import('node:crypto')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(randomUUID).toHaveBeenCalled()
        const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
        expect(savedUser.id.getValue()).toBe(TEST_CONSTANTS.MOCK_UUID)
      })
    })
  })
})
