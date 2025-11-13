import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DuplicatedError, RepositoryError } from '../../domain/errors/index.js'
import { User } from '../../domain/models/User.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { Err, Ok } from '../../domain/types/Result.js'
import {
  buildAdminUser,
  buildCreateUserDTO,
  buildExistingUser,
  buildSuperAdminUser,
  buildUser,
  expectError,
  expectErrorType,
  expectSuccess,
  TEST_CONSTANTS,
} from '../../infrastructure/testing/index.js'
import { CreateUserUseCase } from './CreateUserUseCase.js'

// Mock external dependencies
vi.mock('../../infrastructure/auth/password-utils.js', () => ({
  hashPassword: vi.fn(() => Promise.resolve(TEST_CONSTANTS.users.johnDoe.passwordHash)),
}))

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.mockUuid),
}))

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository

  // Mock user data - represents a newly created user with generated UUID
  const mockUser = buildUser({ id: TEST_CONSTANTS.mockUuid })

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

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).toBeDefined()
        expect(data.id).toBe(TEST_CONSTANTS.mockUuid)
        expect(data.email).toBe(TEST_CONSTANTS.users.johnDoe.email)
        expect(data.role).toBe(TEST_CONSTANTS.users.johnDoe.role)
      })

      it('should check if email already exists', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).toHaveBeenCalledWith({
          email: TEST_CONSTANTS.users.johnDoe.email,
        })
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should hash password before saving', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        const { hashPassword } = await import('../../infrastructure/auth/password-utils.js')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(hashPassword).toHaveBeenCalledWith(TEST_CONSTANTS.users.johnDoe.password)
        expect(hashPassword).toHaveBeenCalledTimes(1)
      })

      it('should save user with hashed password', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(userRepository.save).toHaveBeenCalledTimes(1)

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(
          vi.mocked(userRepository.save),
        )

        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser.email.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.email)
        expect(savedUser.getPasswordHash()).toBe(TEST_CONSTANTS.users.johnDoe.passwordHash)
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.users.johnDoe.role)
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data).not.toHaveProperty('passwordHash')
        expect(data).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: TEST_CONSTANTS.users.johnDoe.email,
          id: TEST_CONSTANTS.mockUuid,
          role: TEST_CONSTANTS.users.johnDoe.role,
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should convert dates to ISO strings in response', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(typeof data.createdAt).toBe('string')
        expect(typeof data.updatedAt).toBe('string')
        expect(data.createdAt).toBe(TEST_CONSTANTS.mockDateIso)
        expect(data.updatedAt).toBe(TEST_CONSTANTS.mockDateIso)
      })
    })

    describe('error cases', () => {
      it('should return DuplicatedError when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: 'existing@example.com' })

        const dto = buildCreateUserDTO({ email: 'existing@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(existingUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: DuplicatedError, result })
        expect(error).toBeInstanceOf(DuplicatedError)
        expect(error.message).toContain('already exists')
        expect(error.message).toContain('existing@example.com')
      })

      it('should not hash password when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: 'existing@example.com' })

        const dto = buildCreateUserDTO({ email: 'existing@example.com' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(existingUser))

        const { hashPassword } = await import('../../infrastructure/auth/password-utils.js')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert - Should fail before hashing password
        expectErrorType({ errorType: DuplicatedError, result })
        expect(hashPassword).not.toHaveBeenCalled()
        expect(userRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when findByEmail fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'findByEmail',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createUserUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
      })

      it('should return RepositoryError when save fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        const repositoryError = RepositoryError.forOperation({
          message: TEST_CONSTANTS.errors.databaseConnectionLost,
          operation: 'save',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectError(await createUserUseCase.execute(dto))

        // Assert
        expect(error).toBeInstanceOf(RepositoryError)
        expect(error.message).toBe(TEST_CONSTANTS.errors.databaseConnectionLost)
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()

        const dto = buildCreateUserDTO({
          email: TEST_CONSTANTS.users.adminUser.email,
          password: TEST_CONSTANTS.users.adminUser.password,
          role: TEST_CONSTANTS.users.adminUser.role,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(adminUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(TEST_CONSTANTS.users.adminUser.role)

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(
          vi.mocked(userRepository.save),
        )
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.users.adminUser.role)
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()

        const dto = buildCreateUserDTO({
          email: TEST_CONSTANTS.users.superAdminUser.email,
          password: TEST_CONSTANTS.users.superAdminUser.password,
          role: TEST_CONSTANTS.users.superAdminUser.role,
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(superAdminUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(TEST_CONSTANTS.users.superAdminUser.role)

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(
          vi.mocked(userRepository.save),
        )
        expect(savedUser.role.getValue()).toBe(TEST_CONSTANTS.users.superAdminUser.role)
      })

      it('should generate UUID for new user', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        const { randomUUID } = await import('node:crypto')

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(randomUUID).toHaveBeenCalled()

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(
          vi.mocked(userRepository.save),
        )
        expect(savedUser.id.getValue()).toBe(TEST_CONSTANTS.mockUuid)
      })
    })
  })
})
