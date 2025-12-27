import { GetUserUseCase } from '@application/use-cases/GetUserUseCase.js'
import type { IUserRepository } from '@domain/repositories/IUserRepository.js'
import { faker } from '@faker-js/faker'
import { buildUser } from '@infrastructure/testing/index.js'
import { Err, NotFoundError, Ok, RepositoryError, UserId } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('GetUserUseCase', () => {
  let getUserUseCase: GetUserUseCase
  let userRepository: IUserRepository

  beforeEach(() => {
    vi.clearAllMocks()

    userRepository = { findById: vi.fn() } as unknown as IUserRepository

    getUserUseCase = GetUserUseCase.create({ userRepository })
  })

  describe('execute', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------
    describe('Success Scenarios', () => {
      it('should return user DTO when user exists', async () => {
        // Arrange
        const user = buildUser()

        vi.mocked(userRepository.findById).mockResolvedValue(Ok(user))

        // Act
        const result = await getUserUseCase.execute({ id: user.id })

        // Assert
        const dto = expectSuccess(result)

        expect(userRepository.findById).toHaveBeenCalledWith({ id: user.id })

        expect(dto.id).toBe(user.id)
        expect(dto.email).toBe(user.email.getValue())
        expect(dto.role).toBe(user.role.getValue())
        expect(dto.createdAt).toBe(user.createdAt.toISOString())
        expect(dto.updatedAt).toBe(user.updatedAt.toISOString())
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
        const result = await getUserUseCase.execute({ id: nonExistentId })

        // Assert
        const error = expectErrorType({ errorType: NotFoundError, result })
        expect(error.message).toContain('User')
        expect(error.metadata?.identifier).toBe(nonExistentId)
      })
    })

    // -------------------------------------------------------------------------
    // ⚠️ INFRASTRUCTURE & LOGIC ERRORS
    // -------------------------------------------------------------------------
    describe('Infrastructure Errors', () => {
      it('should return RepositoryError when database fails', async () => {
        // Arrange
        const id = UserId.random()
        const errorMessage = faker.lorem.sentence()

        vi.mocked(userRepository.findById).mockResolvedValue(
          Err(RepositoryError.forOperation({ message: errorMessage, operation: 'findById' })),
        )

        // Act
        const result = await getUserUseCase.execute({ id })

        // Assert
        const error = expectErrorType({ errorType: RepositoryError, result })
        expect(error.message).toBe(errorMessage)
      })
    })
  })
})
