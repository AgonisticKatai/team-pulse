import type { IPasswordHasher } from '@features/auth/domain/services/password-hasher/IPasswordHasher.js'
import { CreateUserUseCase } from '@features/users/application/use-cases/create-user/CreateUserUseCase.js'
import { User } from '@features/users/domain/models/user/User.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import { buildCreateUserDTO, buildUser } from '@shared/testing/index.js'
import { ConflictError, Err, IdUtils, Ok, RepositoryError, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess, TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('CreateUserUseCase', () => {
  let createUserUseCase: CreateUserUseCase
  let userRepository: IUserRepository
  let passwordHasher: IPasswordHasher

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
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return Ok with user data when creation succeeds', async () => {
        // Arrange
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        // Act
        const result = await createUserUseCase.execute({ dto })
        const response = expectSuccess(result)

        // Assert
        expect(response.id).toBeDefined()
        expect(response.email).toBe(dto.email.toLowerCase()) // Email is normalized to lowercase
        expect(response.role).toBe(dto.role)
        expect(response).not.toHaveProperty('passwordHash')
      })

      it('should save user with hashed password and correct properties', async () => {
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        await createUserUseCase.execute({ dto })

        expect(userRepository.save).toHaveBeenCalledTimes(1)
        expect(passwordHasher.hash).toHaveBeenCalledWith({ password: dto.password })

        // Check what was passed to the repository
        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))

        expect(savedUser).toBeInstanceOf(User)
        expect(IdUtils.isValid(savedUser.id)).toBe(true)
        expect(savedUser.email.getValue()).toBe(dto.email.toLowerCase()) // Email is normalized
        expect(savedUser.role.getValue()).toBe(dto.role)
        // Check hash was set (mock returns johnDoe hash)
        expect(savedUser.getPasswordHash()).toBe(TEST_CONSTANTS.users.johnDoe.passwordHash)
      })

      it('should check if email already exists before creating', async () => {
        const dto = buildCreateUserDTO()

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        await createUserUseCase.execute({ dto })

        expect(userRepository.findByEmail).toHaveBeenCalledWith({ email: dto.email })
        expect(userRepository.findByEmail).toHaveBeenCalledTimes(1)
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should return ValidationError when email is invalid', async () => {
        // Arrange
        const dto = buildCreateUserDTO({ email: 'invalid-email' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(passwordHasher.hash).mockResolvedValue(Ok('some-hash'))

        // Act
        // Error happens in User.create
        expectErrorType({ errorType: ValidationError, result: await createUserUseCase.execute({ dto }) })

        // Assert
        expect(userRepository.save).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return ConflictError when email already exists', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const existingUser = buildUser({ email: dto.email })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(existingUser))

        // Act
        const error = expectErrorType({ errorType: ConflictError, result: await createUserUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toContain('already exists')
        expect(passwordHasher.hash).not.toHaveBeenCalled() // Fail fast before hashing
        expect(userRepository.save).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when repository save fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const repositoryError = RepositoryError.forOperation({ message: 'DB Error', operation: 'save' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(userRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectErrorType({ errorType: RepositoryError, result: await createUserUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toBe('DB Error')
      })

      it('should return RepositoryError when password hashing fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const hashError = RepositoryError.forOperation({ message: 'Hash failed', operation: 'hash' })
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        vi.mocked(passwordHasher.hash).mockResolvedValue(Err(hashError))

        const error = expectErrorType({ errorType: RepositoryError, result: await createUserUseCase.execute({ dto }) })
        expect(error.message).toBe('Hash failed')
      })

      it('should return RepositoryError when findByEmail fails', async () => {
        // Arrange
        const dto = buildCreateUserDTO()
        const repositoryError = RepositoryError.forOperation({ message: 'DB Error', operation: 'findByEmail' })

        vi.mocked(userRepository.findByEmail).mockResolvedValue(Err(repositoryError))

        // Act
        const error = expectErrorType({ errorType: RepositoryError, result: await createUserUseCase.execute({ dto }) })

        // Assert
        expect(error.message).toBe('DB Error')
      })
    })
  })
})
