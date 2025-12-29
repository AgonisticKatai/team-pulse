import { faker } from '@faker-js/faker'
import { Err, Ok } from '@team-pulse/shared'
import { buildLoginResponseDTO, expectError, expectSuccess } from '@team-pulse/shared/testing'
import type { IHttpClient } from '@web/shared/infrastructure/http/IHttpClient.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthRepository } from './AuthRepository.js'

describe('AuthRepository', () => {
  let authRepository: AuthRepository
  let httpClient: IHttpClient

  beforeEach(() => {
    vi.clearAllMocks()
    httpClient = {
      delete: vi.fn(),
      ejectInterceptor: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      useErrorInterceptor: vi.fn(),
      useRequestInterceptor: vi.fn(),
      useResponseInterceptor: vi.fn(),
    } as unknown as IHttpClient

    authRepository = AuthRepository.create({ httpClient })
  })

  // -------------------------------------------------------------------------
  // 🔐 LOGIN
  // -------------------------------------------------------------------------
  describe('login', () => {
    it('should call httpClient.post with correct endpoint and return login response', async () => {
      // Arrange
      const email = faker.internet.email()
      const password = faker.internet.password()
      const mockResponse = buildLoginResponseDTO()

      vi.mocked(httpClient.post).mockResolvedValue(Ok(mockResponse))

      // Act
      const result = await authRepository.login({ email, password })

      // Assert
      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', { email, password })
      expect(httpClient.post).toHaveBeenCalledTimes(1)

      const response = expectSuccess(result)
      expect(response).toEqual(mockResponse)
    })

    it('should return Err when httpClient.post fails', async () => {
      // Arrange
      const email = faker.internet.email()
      const password = faker.internet.password()
      const errorMessage = faker.lorem.sentence()
      const error = new Error(errorMessage)

      vi.mocked(httpClient.post).mockResolvedValue(Err(error))

      // Act
      const result = await authRepository.login({ email, password })

      // Assert
      const resultError = expectError(result)
      expect(resultError).toEqual(error)
    })
  })

  // -------------------------------------------------------------------------
  // 🚪 LOGOUT
  // -------------------------------------------------------------------------
  describe('logout', () => {
    it('should call httpClient.post with correct endpoint', async () => {
      // Arrange
      vi.mocked(httpClient.post).mockResolvedValue(Ok(undefined))

      // Act
      const result = await authRepository.logout()

      // Assert
      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(httpClient.post).toHaveBeenCalledTimes(1)

      expectSuccess(result)
    })

    it('should return Err when httpClient.post fails', async () => {
      // Arrange
      const errorMessage = faker.lorem.sentence()
      const error = new Error(errorMessage)

      vi.mocked(httpClient.post).mockResolvedValue(Err(error))

      // Act
      const result = await authRepository.logout()

      // Assert
      const resultError = expectError(result)
      expect(resultError).toEqual(error)
    })
  })

  // -------------------------------------------------------------------------
  // 🔄 REFRESH TOKEN
  // -------------------------------------------------------------------------
  describe('refreshToken', () => {
    it('should call httpClient.post with correct endpoint and return new tokens', async () => {
      // Arrange
      const refreshToken = faker.internet.jwt()
      const mockResponse = {
        accessToken: faker.internet.jwt(),
        refreshToken: faker.internet.jwt(),
      }

      vi.mocked(httpClient.post).mockResolvedValue(Ok(mockResponse))

      // Act
      const result = await authRepository.refreshToken({ refreshToken })

      // Assert
      expect(httpClient.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken })
      expect(httpClient.post).toHaveBeenCalledTimes(1)

      const response = expectSuccess(result)
      expect(response).toEqual(mockResponse)
    })

    it('should return Err when httpClient.post fails', async () => {
      // Arrange
      const refreshToken = faker.internet.jwt()
      const errorMessage = faker.lorem.sentence()
      const error = new Error(errorMessage)

      vi.mocked(httpClient.post).mockResolvedValue(Err(error))

      // Act
      const result = await authRepository.refreshToken({ refreshToken })

      // Assert
      const resultError = expectError(result)
      expect(resultError).toEqual(error)
    })
  })

  // -------------------------------------------------------------------------
  // ✅ VERIFY SESSION
  // -------------------------------------------------------------------------
  describe('verifySession', () => {
    it('should call httpClient.get with correct endpoint and return true for valid session', async () => {
      // Arrange
      vi.mocked(httpClient.get).mockResolvedValue(Ok(true))

      // Act
      const result = await authRepository.verifySession()

      // Assert
      expect(httpClient.get).toHaveBeenCalledWith('/auth/verify')
      expect(httpClient.get).toHaveBeenCalledTimes(1)

      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })

    it('should return false for invalid session', async () => {
      // Arrange
      vi.mocked(httpClient.get).mockResolvedValue(Ok(false))

      // Act
      const result = await authRepository.verifySession()

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should return Err when httpClient.get fails', async () => {
      // Arrange
      const errorMessage = faker.lorem.sentence()
      const error = new Error(errorMessage)

      vi.mocked(httpClient.get).mockResolvedValue(Err(error))

      // Act
      const result = await authRepository.verifySession()

      // Assert
      const resultError = expectError(result)
      expect(resultError).toEqual(error)
    })
  })
})
