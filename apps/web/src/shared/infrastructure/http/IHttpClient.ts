import type { Result } from '@team-pulse/shared'
import type { ErrorInterceptor, InterceptorId, RequestInterceptor, ResponseInterceptor } from './http-client.types.js'

/**
 * HTTP Client Port (Hexagonal Architecture)
 *
 * Defines the contract for HTTP communication.
 * Domain and application layers depend on this interface, not implementations.
 *
 * Benefits:
 * - Testable: Easy to mock in tests
 * - Swappable: Can change implementation (fetch, axios, mock) without affecting consumers
 * - Decoupled: Domain logic doesn't depend on infrastructure details
 */
export interface IHttpClient {
  /**
   * GET request
   */
  get<T>(path: string, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>>

  /**
   * POST request
   */
  post<T, B = unknown>(path: string, body?: B, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>>

  /**
   * PUT request
   */
  put<T, B = unknown>(path: string, body?: B, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>>

  /**
   * DELETE request
   */
  delete<T>(path: string, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>>

  /**
   * Add request interceptor
   * Returns interceptor ID for cleanup
   */
  useRequestInterceptor(interceptor: RequestInterceptor): InterceptorId

  /**
   * Add response interceptor
   * Returns interceptor ID for cleanup
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): InterceptorId

  /**
   * Add error interceptor
   * Returns interceptor ID for cleanup
   */
  useErrorInterceptor(interceptor: ErrorInterceptor): InterceptorId

  /**
   * Remove interceptor by ID
   */
  ejectInterceptor(id: InterceptorId): void
}
