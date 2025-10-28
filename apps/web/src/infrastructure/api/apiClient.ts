/**
 * Base API Client (Infrastructure Layer)
 *
 * This is the foundation for all HTTP communication with the backend.
 * It provides:
 * - Type-safe HTTP methods (GET, POST, PATCH, DELETE)
 * - Automatic error handling and mapping
 * - Request/response transformation
 * - Base URL configuration
 *
 * This class is FRAMEWORK-SPECIFIC (knows about fetch API)
 * but provides a clean interface for the application layer.
 */

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    field?: string
    details?: Record<string, unknown>
  }
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly field?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base API Client configuration
 */
export interface ApiClientConfig {
  baseUrl: string
  timeout?: number
}

/**
 * Base API Client
 *
 * Provides HTTP methods with automatic error handling
 */
export class ApiClient {
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout ?? 30000 // 30s default
  }

  /**
   * GET request
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }

  /**
   * POST request
   */
  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', path, data)
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, data)
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  /**
   * Internal request method
   */
  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const headers: Record<string, string> = {}
      if (data) {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse response
      const responseData = (await response.json()) as ApiResponse<T>

      // Handle error responses
      if (!response.ok || !responseData.success) {
        const errorData = responseData as ApiErrorResponse
        throw new ApiError(
          errorData.error.message,
          errorData.error.code,
          response.status,
          errorData.error.field,
          errorData.error.details,
        )
      }

      // Return successful data
      return (responseData as ApiSuccessResponse<T>).data
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 'TIMEOUT', 408)
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError('Network error', 'NETWORK_ERROR', 0)
      }

      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error
      }

      // Unknown error
      throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR', 500)
    }
  }
}

/**
 * Create API client instance
 *
 * Uses environment variable for base URL (Vite convention)
 *
 * In both development and production, we use relative URLs:
 * - Development: Vite proxy redirects /api/* to http://localhost:3000/api/*
 * - Production: Vercel rewrites /api/* to serverless functions
 */
export function createApiClient(): ApiClient {
  // Use VITE_API_URL if explicitly set, otherwise use relative URLs
  const baseUrl = import.meta.env.VITE_API_URL ?? ''

  return new ApiClient({ baseUrl })
}
