import { Err, InternalError, Ok, type Result } from '@team-pulse/shared'
import { mapStatusToError } from './error-mapper.js'
import {
  type ApiResponse,
  DEFAULT_RETRY_STRATEGY,
  type ErrorInterceptor,
  type HttpClientConfig,
  type HttpRequestConfig,
  type HttpResponse,
  type InterceptorId,
  type RequestInterceptor,
  type ResponseInterceptor,
  type RetryStrategy,
} from './http-client.types'
import type { IHttpClient } from './IHttpClient.js'
import { shouldRetryRequest, waitForRetry } from './retry-utils.js'

/**
 * Interceptor entry with ID and function
 */
interface InterceptorEntry<T> {
  readonly id: InterceptorId
  readonly fn: T
}

/**
 * Fetch-based HTTP Client implementation (MODO DIOS)
 *
 * Features:
 * - Native fetch API (zero dependencies)
 * - Interceptor pipeline with cleanup
 * - Automatic retry with exponential backoff
 * - Request timeout via AbortController
 * - HTTP status → domain error mapping
 * - Type-safe Result<T, Error> pattern
 * - Immutable configuration
 */
export class FetchHttpClient implements IHttpClient {
  private readonly config: HttpClientConfig
  private readonly retryStrategy: RetryStrategy
  private readonly requestInterceptors: InterceptorEntry<RequestInterceptor>[] = []
  private readonly responseInterceptors: InterceptorEntry<ResponseInterceptor>[] = []
  private readonly errorInterceptors: InterceptorEntry<ErrorInterceptor>[] = []

  constructor(config: HttpClientConfig) {
    this.config = Object.freeze({ ...config })
    this.retryStrategy = Object.freeze({ ...DEFAULT_RETRY_STRATEGY, ...config.retryStrategy })
  }

  get<T>(path: string, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>> {
    return this.request<T>({ headers, method: 'GET', path })
  }

  post<T, B = unknown>(path: string, body?: B, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>> {
    return this.request<T>({ body, headers, method: 'POST', path })
  }

  put<T, B = unknown>(path: string, body?: B, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>> {
    return this.request<T>({ body, headers, method: 'PUT', path })
  }

  delete<T>(path: string, headers?: Readonly<Record<string, string>>): Promise<Result<T, Error>> {
    return this.request<T>({ headers, method: 'DELETE', path })
  }

  useRequestInterceptor(interceptor: RequestInterceptor): InterceptorId {
    const id = Symbol('request-interceptor')
    this.requestInterceptors.push({ fn: interceptor, id })
    return id
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): InterceptorId {
    const id = Symbol('response-interceptor')
    this.responseInterceptors.push({ fn: interceptor, id })
    return id
  }

  useErrorInterceptor(interceptor: ErrorInterceptor): InterceptorId {
    const id = Symbol('error-interceptor')
    this.errorInterceptors.push({ fn: interceptor, id })
    return id
  }

  ejectInterceptor(id: InterceptorId): void {
    const removeById = <T>(arr: InterceptorEntry<T>[]) => {
      const index = arr.findIndex((entry) => entry.id === id)
      if (index !== -1) arr.splice(index, 1)
    }

    removeById(this.requestInterceptors)
    removeById(this.responseInterceptors)
    removeById(this.errorInterceptors)
  }

  /**
   * Core request method with retry logic and interceptor pipeline
   */
  private async request<T>(initialConfig: HttpRequestConfig): Promise<Result<T, Error>> {
    const maxRetries = initialConfig.retries ?? this.retryStrategy.maxRetries
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const config = await this.applyRequestInterceptors(initialConfig)
        const response = await this.executeRequest<T>(config)
        const interceptedResponse = await this.applyResponseInterceptors(response)

        return Ok(interceptedResponse.data)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        const shouldRetry = shouldRetryRequest({
          attempt,
          error: lastError,
          maxRetries,
          strategy: this.retryStrategy,
        })
        if (!shouldRetry) break

        await waitForRetry({ attempt, strategy: this.retryStrategy })
      }
    }

    const interceptedError = await this.applyErrorInterceptors(lastError!)
    return Err(interceptedError)
  }

  /**
   * Execute HTTP request using fetch
   */
  private async executeRequest<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const url = `${this.config.baseURL}${config.path}`
    const timeout = config.timeout ?? this.config.timeout ?? 30000

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...config.headers,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    try {
      const response = await fetch(url, {
        body: config.body ? JSON.stringify(config.body) : undefined,
        headers,
        method: config.method,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const apiResponse = (await response.json()) as ApiResponse<T>

      const isError = !(response.ok && apiResponse.success)
      if (isError) {
        const errorResponse = apiResponse as Extract<ApiResponse<T>, { success: false }>
        throw mapStatusToError({ message: errorResponse.error.message, status: response.status })
      }

      const successResponse = apiResponse as Extract<ApiResponse<T>, { success: true }>

      return {
        data: successResponse.data,
        headers: response.headers,
        status: response.status,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw InternalError.create({ message: `Request timeout after ${timeout}ms` })
      }

      throw error
    }
  }

  /**
   * Apply all request interceptors in order
   */
  private async applyRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
    let result = config

    for (const { fn } of this.requestInterceptors) {
      result = await fn(result)
    }

    return result
  }

  /**
   * Apply all response interceptors in order
   */
  private async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let result = response

    for (const { fn } of this.responseInterceptors) {
      result = await fn(result)
    }

    return result
  }

  /**
   * Apply all error interceptors in order
   */
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let result = error

    for (const { fn } of this.errorInterceptors) {
      result = await fn(result)
    }

    return result
  }
}
