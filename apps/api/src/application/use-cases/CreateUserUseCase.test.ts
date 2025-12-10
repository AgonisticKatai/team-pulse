import { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase.js'
import { User } from '@domain/models/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import type { IPasswordHasher } from '@domain/services/IPasswordHasher.js'
import { buildAdminUser, buildCreateUserDTO, buildSuperAdminUser, buildUser } from '@infrastructure/testing/index.js'
import { ConflictError, Err, Ok, RepositoryError } from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess, TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher

  // Mock user data - represents a newly created user with generated UUID
  const mockUser = buildUser({ createdAt: TEST_CONSTANTS.mockDate, updatedAt: TEST_CONSTANTS.mockDate })

  beforeEach(() => {
    vi.clearAllMocks()

    userRepository = {
      existsByEmail: vi.fn(),
      findAllPaginated: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
    } as unknown as IUserRepository
    passwordHasher = {
      hash: vi.fn(() => Promise.resolve(Ok(TEST_CONSTANTS.users.johnDoe.passwordHash))),
      verify: vi.fn(),
    } as unknown as IPasswordHasher

    createUserUseCase = CreateUserUseCase.create({ passwordHasher, userRepository })
  })

  describe('execute', () => {
    describe('successful user creation', () => {
      it('should create user with valid data', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        const data = expectSuccess(result)
        expect(data.id).toBe(mockUser.id)
        expect(data.email).toBe(mockUser.email.getValue())
        expect(data.role).toBe(mockUser.role.getValue())
      })

      it('should check if email already exists', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).toHaveBeenCalledWith({ email: dto.email })
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })

      it('should hash password before saving', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectSuccess(result)
        expect(passwordHasher.hash).toHaveBeenCalledWith({ password: dto.password })
        expect(passwordHasher.hash).toHaveBeenCalledTimes(1)
      })

      it('should save user with hashed password', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectSuccess(result)
        expect(userRepository.save).toHaveBeenCalledTimes(1)

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))

        expect(savedUser).toBeInstanceOf(User)
        expect(savedUser.email.getValue()).toBe(dto.email.toLowerCase())
        expect(savedUser.getPasswordHash()).toBe(TEST_CONSTANTS.users.johnDoe.passwordHash)
        expect(savedUser.role.getValue()).toBe(dto.role)
      })

      it('should return user DTO without password hash', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        const data = expectSuccess(result)
        expect(data).not.toHaveProperty('passwordHash')
        expect(data).toEqual({
          createdAt: TEST_CONSTANTS.mockDateIso,
          email: mockUser.email.getValue(),
          id: mockUser.id,
          role: mockUser.role.getValue(),
          updatedAt: TEST_CONSTANTS.mockDateIso,
        })
      })

      it('should convert dates to ISO strings in response', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

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
        const dto = buildCreateUserDTO({ email: mockUser.email.getValue() })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        const error = expectErrorType({ errorType: ConflictError, result })
        expect(error.message).toContain('already exists')
      })

      it('should not hash password when email already exists', async () => {
        // Arrange
        const dto = buildCreateUserDTO({ email: mockUser.email.getValue() })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert - Should fail before hashing password
        expectErrorType({ errorType: ConflictError, result })
        expect(passwordHasher.hash).not.toHaveBeenCalled()
        expect(userRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when findByEmail fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const repositoryError = RepositoryError.forOperation({
          message: 'Database connection lost',
          operation: 'findByEmail',
        })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: RepositoryError, result })
      })

      it('should return RepositoryError when save fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const repositoryError = RepositoryError.forOperation({ message: 'Database connection lost', operation: 'save' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectErrorType({ errorType: RepositoryError, result })
      })
    })

    describe('edge cases', () => {
      it('should handle user with ADMIN role', async () => {
        // Arrange
        const adminUser = buildAdminUser()
        const dto = buildCreateUserDTO({ role: adminUser.role.getValue() })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(adminUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(adminUser.role.getValue())

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe(adminUser.role.getValue())
      })

      it('should handle user with SUPER_ADMIN role', async () => {
        // Arrange
        const superAdminUser = buildSuperAdminUser()
        const dto = buildCreateUserDTO({ role: superAdminUser.role.getValue() })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(superAdminUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        const data = expectSuccess(result)
        expect(data.role).toBe(superAdminUser.role.getValue())

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
        expect(savedUser.role.getValue()).toBe(superAdminUser.role.getValue())
      })

      it('should create user with generated ID', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Ok(mockUser))

        // Act
        const result = await createUserUseCase.execute({ dto })

        // Assert
        expectSuccess(result)

        // Get the saved user from the mock call
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))

        // Verify the user was created with an ID
        expect(savedUser.id).toBeDefined()
        expect(savedUser.id).toBeTruthy()
      })
    })
  })
})
