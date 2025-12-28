import { DeleteUserUseCase } from '@application/use-cases/DeleteUserUseCase.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import { faker } from '@faker-js/faker'
import { buildUser } from '@shared/testing/index.js'
import { Err, NotFoundError, Ok, RepositoryError, UserId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('DeleteUserUseCase', () => {
  let deleteUserUseCase: DeleteUserUseCase
  let userRepository: IUserRepository

  beforeEach(() => {
    vi.clearAllMocks()

    userRepository = { delete: vi.fn(), findById: vi.fn() } as unknown as IUserRepository

    deleteUserUseCase = DeleteUserUseCase.create({ userRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should delete an existing user', async () => {
        // Arrange
        const user = buildUser()

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(user))
        vi.mocked(userRepository.delete).mockResolvedValue(Ok(true)) // Repository delete returns Ok(boolean)

        // Act
        const result = await deleteUserUseCase.execute({ id: user.id })

        // Assert
        expectSuccess(result)
        expect(userRepository.findById).toHaveBeenCalledWith({ id: user.id })
        expect(userRepository.delete).toHaveBeenCalledWith({ id: user.id })
      })
    })

    // -------------------------------------------------------------------------
    // ❌ DOMAIN VALIDATION ERRORS (Business Rules)
    // -------------------------------------------------------------------------
    describe('Validation Errors', () => {
      it('should return NotFoundError when user does not exist', async () => {
        // Arrange
        const nonExistentId = UserId.random()

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(null))

        // Act
        const result = await deleteUserUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('User')
        expect(error.metadata?.identifier).toBe(nonExistentId)
        expect(userRepository.delete).not.toHaveBeenCalled()
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when finding user fails', async () => {
        // Arrange
        const id = UserId.random()
        const dbError = RepositoryError.forOperation({
          message: faker.lorem.sentence(),
          operation: 'findById',
        })

        vi.mocked(userRepository.findById).mockResolvedValue(Err(dbError))

        // Act
        const result = await deleteUserUseCase.execute({ id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(userRepository.delete).not.toHaveBeenCalled()
      })

      it('should return RepositoryError when deletion fails', async () => {
        // Arrange
        const user = buildUser()
        const dbError = RepositoryError.forOperation({
          message: faker.lorem.sentence(),
          operation: 'delete',
        })

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(user))
        vi.mocked(userRepository.delete).mockResolvedValue(Err(dbError))

        // Act
        const result = await deleteUserUseCase.execute({ id: user.id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error).toBe(dbError)
        expect(userRepository.delete).toHaveBeenCalledWith({ id: user.id })
      })
    })
  })
})
