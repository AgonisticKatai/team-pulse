import { UpdateUserUseCase } from '@application/use-cases/UpdateUserUseCase.js'
import type { User } from '@domain/models/user/User.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import { faker } from '@faker-js/faker'
import { buildUser } from '@shared/testing/index.js'
import type { UpdateUserDTO } from '@team-pulse/shared'
import { ConflictError, Err, NotFoundError, Ok, RepositoryError, UserId, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectMockCallArg, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('UpdateUserUseCase', () => {
  let updateUserUseCase: UpdateUserUseCase
  let userRepository: IUserRepository

  beforeEach(() => {
    vi.clearAllMocks()

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as IUserRepository

    updateUserUseCase = UpdateUserUseCase.create({ userRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should update user email and ensure persistence', async () => {
        // Arrange
        const originalUser = buildUser({ updatedAt: faker.date.past() })
        const dto = { email: `updated.${originalUser.email.getValue()}` } satisfies UpdateUserDTO

        // 1. Found existing
        vi.mocked(userRepository.findById).mockResolvedValue(Ok(originalUser))
        // 2. Email check: Not taken
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null))
        // 3. Save
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        // Act
        const result = await updateUserUseCase.execute({ dto, id: originalUser.id })

        // Assert
        const response = expectSuccess(result)

        expect(response.id).toBe(originalUser.id)
        expect(response.email).toBe(dto.email)

        expect(userRepository.findByEmail).toHaveBeenCalledWith({ email: dto.email })

        const { user: savedUser } = expectMockCallArg<{ user: User }>(vi.mocked(userRepository.save))
        expect(savedUser.updatedAt.getTime()).toBeGreaterThan(originalUser.updatedAt.getTime())
      })

      it('should skip uniqueness check if email is unchanged', async () => {
        // Arrange
        const originalUser = buildUser()
        const dto = { email: originalUser.email.getValue() } satisfies UpdateUserDTO

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(originalUser))
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        // Act
        const result = await updateUserUseCase.execute({ dto, id: originalUser.id })

        // Assert
        expectSuccess(result)
        expect(userRepository.findByEmail).not.toHaveBeenCalled()
        expect(userRepository.save).toHaveBeenCalledTimes(1)
      })

      it('should allow updating role', async () => {
        // Arrange
        // Assuming buildUser defaults to some role, let's switch it
        // If buildUser() -> USER, switch to ADMIN
        const originalUser = buildUser()
        // Determine opposite role for test
        const newRole = originalUser.role.getValue() === 'admin' ? 'guest' : 'admin'

        const dto = { role: newRole } satisfies UpdateUserDTO

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(originalUser))
        vi.mocked(userRepository.save).mockImplementation(async ({ user }) => Ok(user))

        // Act
        const result = await updateUserUseCase.execute({ dto, id: originalUser.id })

        // Assert
        const response = expectSuccess(result)
        expect(response.role).toBe(newRole)
        expect(response.email).toBe(originalUser.email.getValue()) // Preserved
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should return NotFoundError if user does not exist', async () => {
        // Arrange
        const id = UserId.random()
        const dto = { email: 'new@example.com' } satisfies UpdateUserDTO

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await updateUserUseCase.execute({ dto, id })

        // Assert
        expectErrorType({ errorType: NotFoundError, result })
        expect(userRepository.save).not.toHaveBeenCalled()
      })

      it('should return ConflictError if new email is taken by another user', async () => {
        // Arrange
        const userToUpdate = buildUser()
        const otherUser = buildUser()
        const dto = { email: otherUser.email.getValue() } satisfies UpdateUserDTO

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(userToUpdate))
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(otherUser))

        // Act
        const result = await updateUserUseCase.execute({ dto, id: userToUpdate.id })

        // Assert
        const error = expectErrorType({ errorType: ConflictError, result })
        expect(error.message).toContain('already exists')
        expect(userRepository.save).not.toHaveBeenCalled()
      })

      it('should return ValidationError if update violates domain rules', async () => {
        // Arrange
        const user = buildUser()
        const dto: UpdateUserDTO = { email: 'invalid-email' } // Invalid email format

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(user))
        vi.mocked(userRepository.findByEmail).mockResolvedValue(Ok(null)) // Uniqueness check passes (conceptually)

        // Act
        const result = await updateUserUseCase.execute({ dto, id: user.id })

        // Assert
        expectErrorType({ errorType: ValidationError, result })
        expect(userRepository.save).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when repository findById fails', async () => {
        // Arrange
        const id = UserId.random()
        const dbError = RepositoryError.forOperation({ message: 'DB Error', operation: 'findById' })

        vi.mocked(userRepository.findById).mockResolvedValue(Err(dbError))

        // Act
        const result = await updateUserUseCase.execute({ dto: {}, id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })

      it('should return RepositoryError if save fails', async () => {
        // Arrange
        const user = buildUser()
        const dto = { role: 'admin' } satisfies UpdateUserDTO
        const dbError = RepositoryError.forOperation({ message: 'Save Error', operation: 'save' })

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(user))
        vi.mocked(userRepository.save).mockResolvedValue(Err(dbError))

        // Act
        const result = await updateUserUseCase.execute({ dto, id: user.id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
      })
    })
  })
})
