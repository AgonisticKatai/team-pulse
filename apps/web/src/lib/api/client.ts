/**
 * HTTP Methods
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.PROD ? import.meta.env.VITE_API_URL || 'http://localhost:3000' : '/api'

/**
 * Request Options
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * API Error Class
 *
 * Custom error class for API-related errors with status code.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * API Client
 *
 * Modern fetch-based API client with:
 * - Automatic JSON parsing
 * - Error handling
 * - Query parameters support
 * - Bearer token authentication
 */
export class ApiClient {
  private baseURL: string
  private defaultHeaders: HeadersInit

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        Authorization: `Bearer ${token}`,
      }
    } else {
      const { Authorization: _Authorization, ...rest } = this.defaultHeaders as Record<string, string>
      this.defaultHeaders = rest
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseURL)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    return url.toString()
  }

  /**
   * Generic request method
   */
  private async request<T>(method: HttpMethod, endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options

    const url = this.buildURL(endpoint, params)

    const response = await fetch(url, {
      method,
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })

    // Handle non-OK responses
    if (!response.ok) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = await response.text()
      }

      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, errorData)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T
    }

    // Parse JSON response
    return response.json()
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, options)
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: JSON.stringify(data),
    })
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, {
      ...options,
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, options)
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient()
