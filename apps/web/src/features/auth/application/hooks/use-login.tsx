import { faker } from '@faker-js/faker'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthenticationError, Err, Ok } from '@team-pulse/shared'
import { buildLoginResponseDTO } from '@team-pulse/shared/testing'
import { renderHook, waitFor } from '@testing-library/react'
import { loginUseCase } from '@web/core/container/container.js'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLogin } from './useLogin.js'

// Mock the DI container
vi.mock('@web/core/container/container.js', () => ({
  loginUseCase: {
    execute: vi.fn(),
  },
}))

describe('useLogin', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          retry: false,
        },
        queries: {
          retry: false,
        },
      },
    })

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // ✅ SUCCESS - Result<T, E> OK handling
  // -------------------------------------------------------------------------
  describe('Success - Ok(data)', () => {
    it('should call use case with correct parameters and return data on success', async () => {
      // Arrange
      const mockResponse = buildLoginResponseDTO()
      const email = faker.internet.email()
      const password = faker.internet.password()

      vi.mocked(loginUseCase.execute).mockResolvedValue(Ok(mockResponse))

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      // Act
      result.current.mutate({
        email,
        password,
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(loginUseCase.execute).toHaveBeenCalledWith({
        dto: {
          email,
          password,
        },
      })
      expect(loginUseCase.execute).toHaveBeenCalledTimes(1)
    })
  })

  // -------------------------------------------------------------------------
  // ❌ ERROR - Result<T, E> Err handling
  // -------------------------------------------------------------------------
  describe('Error - Err(error)', () => {
    it('should throw domain error when use case returns Err(AuthenticationError)', async () => {
      // Arrange
      const errorMessage = faker.lorem.sentence()
      const authError = AuthenticationError.create({
        message: errorMessage,
        metadata: { field: 'credentials', reason: 'invalid_credentials' },
      })

      vi.mocked(loginUseCase.execute).mockResolvedValue(Err(authError))

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      // Act
      result.current.mutate({
        email: faker.internet.email(),
        password: faker.internet.password(),
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(AuthenticationError)
      expect(result.current.error?.message).toBe(errorMessage)
    })

    it('should throw generic error when use case returns Err(Error)', async () => {
      // Arrange
      const errorMessage = faker.lorem.sentence()
      const repositoryError = new Error(errorMessage)
      vi.mocked(loginUseCase.execute).mockResolvedValue(Err(repositoryError))

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      // Act
      result.current.mutate({
        email: faker.internet.email(),
        password: faker.internet.password(),
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toBe(errorMessage)
    })
  })

  // -------------------------------------------------------------------------
  // 💥 EXCEPTION - Promise rejection handling
  // -------------------------------------------------------------------------
  describe('Exception - Promise rejection', () => {
    it('should handle unexpected promise rejection from use case', async () => {
      // Arrange
      const errorMessage = faker.lorem.sentence()
      const unexpectedError = new Error(errorMessage)
      vi.mocked(loginUseCase.execute).mockRejectedValue(unexpectedError)

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      })

      // Act
      result.current.mutate({
        email: faker.internet.email(),
        password: faker.internet.password(),
      })

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(unexpectedError)
    })
  })
})
