/**
 * HTTP Client Types
 *
 * Type definitions for HTTP communication infrastructure
 */

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * API Response format from backend
 * Generic wrapper that all API responses follow
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * HTTP Request configuration
 */
export interface HttpRequestConfig<B = unknown> {
  readonly method: HttpMethod
  readonly path: string
  readonly body?: B
  readonly headers?: Readonly<Record<string, string>>
  readonly timeout?: number
  readonly retries?: number
}

/**
 * HTTP Response with metadata
 */
export interface HttpResponse<T> {
  readonly data: T
  readonly status: number
  readonly headers: Headers
}

/**
 * Interceptor ID for cleanup
 */
export type InterceptorId = symbol

/**
 * Request Interceptor
 * Transforms request before sending
 * Can be async for operations like token refresh
 */
export type RequestInterceptor = (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>

/**
 * Response Interceptor
 * Transforms successful response
 */
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>

/**
 * Error Interceptor
 * Handles or transforms errors
 * Can recover from errors (e.g., retry logic)
 */
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>

/**
 * Retry Strategy
 */
export interface RetryStrategy {
  /**
   * Maximum number of retries
   */
  maxRetries: number

  /**
   * Delay between retries in milliseconds
   */
  retryDelay: number

  /**
   * Whether to use exponential backoff
   */
  exponentialBackoff: boolean

  /**
   * HTTP status codes that should trigger retry
   */
  retryableStatuses: number[]

  /**
   * Should retry this error?
   */
  shouldRetry?: (error: Error, attemptCount: number) => boolean
}

/**
 * HTTP Client Configuration
 */
export interface HttpClientConfig {
  readonly baseURL: string
  readonly timeout?: number
  readonly headers?: Readonly<Record<string, string>>
  readonly retryStrategy?: RetryStrategy
}

/**
 * Default retry strategy
 */
export const DEFAULT_RETRY_STRATEGY: RetryStrategy = {
  exponentialBackoff: true,
  maxRetries: 3,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryDelay: 1000,
}
