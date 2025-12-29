import { faker } from '@faker-js/faker'
import { Err, Ok } from '@team-pulse/shared'
import { buildLoginResponseDTO, expectError, expectSuccess } from '@team-pulse/shared/testing'
import type { IAuthRepository } from '@web/features/auth/domain/index.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginUseCase } from './LoginUseCase.js'

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase
  let authRepository: IAuthRepository

  beforeEach(() => {
    vi.clearAllMocks()
    authRepository = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      verifySession: vi.fn(),
    } as unknown as IAuthRepository

    loginUseCase = LoginUseCase.create({ authRepository })
  })

  // -------------------------------------------------------------------------
  // ✅ SUCCESS - Successful login
  // -------------------------------------------------------------------------
  describe('Success Scenarios', () => {
    it('should call authRepository.login with correct parameters and return login response', async () => {
      // Arrange
      const email = faker.internet.email()
      const password = faker.internet.password()
      const mockResponse = buildLoginResponseDTO()

      vi.mocked(authRepository.login).mockResolvedValue(Ok(mockResponse))

      // Act
      const result = await loginUseCase.execute({ dto: { email, password } })

      // Assert
      expect(authRepository.login).toHaveBeenCalledWith({ email, password })
      expect(authRepository.login).toHaveBeenCalledTimes(1)

      const response = expectSuccess(result)
      expect(response).toEqual(mockResponse)
    })
  })

  // -------------------------------------------------------------------------
  // ❌ ERROR - Repository errors
  // -------------------------------------------------------------------------
  describe('Error Scenarios', () => {
    it('should return Err when authRepository.login fails', async () => {
      // Arrange
      const email = faker.internet.email()
      const password = faker.internet.password()
      const errorMessage = faker.lorem.sentence()
      const error = new Error(errorMessage)

      vi.mocked(authRepository.login).mockResolvedValue(Err(error))

      // Act
      const result = await loginUseCase.execute({ dto: { email, password } })

      // Assert
      const resultError = expectError(result)
      expect(resultError).toEqual(error)
    })
  })
})
