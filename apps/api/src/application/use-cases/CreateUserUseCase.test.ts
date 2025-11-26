import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase.js'
import { RepositoryError } from '@domain/errors/index.js'
import { User } from '@domain/models/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import { buildAdminUser, buildExistingUser, buildSuperAdminUser, buildUser } from '@infrastructure/testing/index.js'
import { ConflictError } from '@team-pulse/shared/errors'
import { Err, Ok } from '@team-pulse/shared/result'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { buildCreateUserDTO } from '@team-pulse/shared/testing/dto-builders'
import { expectError, expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock external dependencies
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => TEST_CONSTANTS.mockUuid),
}))

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher

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
      findAllPaginated: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    }

    // Mock password hasher
    passwordHasher = {
      hash: vi.fn(() => Promise.resolve(Ok(TEST_CONSTANTS.users.johnDoe.passwordHash))),
      verify: vi.fn(),
    }

    // Create use case instance
    createUserUseCase = CreateUserUseCase.create({ userRepository, passwordHasher })
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

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        expectSuccess(result)
        expect(passwordHasher.hash).toHaveBeenCalledWith({ password: TEST_CONSTANTS.users.johnDoe.password })
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1)
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
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))

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
      it('should return ConflictError when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: TEST_CONSTANTS.emails.existing })

        const dto = buildCreateUserDTO({ email: TEST_CONSTANTS.emails.existing })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(existingUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert
        const error = expectErrorType({ errorType: ConflictError, result })
        expect(error.message).toContain('already exists')
      })

      it('should not hash password when email already exists', async () => {
        // Arrange
        const existingUser = buildExistingUser({ email: TEST_CONSTANTS.emails.existing })

        const dto = buildCreateUserDTO({ email: TEST_CONSTANTS.emails.existing })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(existingUser))

        // Act
        const result = await createUserUseCase.execute(dto)

        // Assert - Should fail before hashing password
        expectErrorType({ errorType: ConflictError, result })
        expect(passwordHasher.hash).not.toHaveBeenCalled()
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
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
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
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
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
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
        expect(savedUser.id.getValue()).toBe(TEST_CONSTANTS.mockUuid)
      })
    })
  })
})
