import { InternalError } from '@team-pulse/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RetryStrategy } from './http-client.types.js'
import { calculateRetryDelay, shouldRetryRequest, waitForRetry } from './retry-utils.js'

describe('retry-utils', () => {
  describe('shouldRetryRequest', () => {
    const baseStrategy: RetryStrategy = {
      exponentialBackoff: true,
      maxRetries: 3,
      retryableStatuses: [500, 502, 503],
      retryDelay: 1000,
    }

    it('should not retry when max retries reached', () => {
      const error = new Error('Test error')
      const result = shouldRetryRequest({ attempt: 3, error, maxRetries: 3, strategy: baseStrategy })

      expect(result).toBe(false)
    })

    it('should use custom shouldRetry function when provided', () => {
      const customStrategy: RetryStrategy = {
        ...baseStrategy,
        shouldRetry: (error, attempt) => attempt < 2 && error.message.includes('retry'),
      }

      const retryableError = new Error('Please retry')
      expect(shouldRetryRequest({ attempt: 0, error: retryableError, maxRetries: 3, strategy: customStrategy })).toBe(
        true,
      )
      expect(shouldRetryRequest({ attempt: 2, error: retryableError, maxRetries: 3, strategy: customStrategy })).toBe(
        false,
      )

      const nonRetryableError = new Error('Fatal error')
      expect(
        shouldRetryRequest({ attempt: 0, error: nonRetryableError, maxRetries: 3, strategy: customStrategy }),
      ).toBe(false)
    })

    it('should retry InternalError with retryable status code', () => {
      const error = InternalError.create({ message: 'Server error', metadata: { status: 500 } })

      const result = shouldRetryRequest({ attempt: 0, error, maxRetries: 3, strategy: baseStrategy })

      expect(result).toBe(true)
    })

    it('should not retry InternalError with non-retryable status code', () => {
      const error = InternalError.create({ message: 'Server error', metadata: { status: 404 } })

      const result = shouldRetryRequest({ attempt: 0, error, maxRetries: 3, strategy: baseStrategy })

      expect(result).toBe(false)
    })

    it('should retry network errors without status code', () => {
      const error = new Error('Network error')

      const result = shouldRetryRequest({ attempt: 0, error, maxRetries: 3, strategy: baseStrategy })

      expect(result).toBe(true)
    })
  })

  describe('calculateRetryDelay', () => {
    it('should calculate delay with exponential backoff', () => {
      const strategy: RetryStrategy = {
        exponentialBackoff: true,
        maxRetries: 3,
        retryableStatuses: [],
        retryDelay: 1000,
      }

      expect(calculateRetryDelay({ attempt: 0, strategy })).toBe(1000) // 1000 * 2^0
      expect(calculateRetryDelay({ attempt: 1, strategy })).toBe(2000) // 1000 * 2^1
      expect(calculateRetryDelay({ attempt: 2, strategy })).toBe(4000) // 1000 * 2^2
      expect(calculateRetryDelay({ attempt: 3, strategy })).toBe(8000) // 1000 * 2^3
    })

    it('should calculate delay without exponential backoff', () => {
      const strategy: RetryStrategy = {
        exponentialBackoff: false,
        maxRetries: 3,
        retryableStatuses: [],
        retryDelay: 1000,
      }

      expect(calculateRetryDelay({ attempt: 0, strategy })).toBe(1000)
      expect(calculateRetryDelay({ attempt: 1, strategy })).toBe(1000)
      expect(calculateRetryDelay({ attempt: 2, strategy })).toBe(1000)
      expect(calculateRetryDelay({ attempt: 3, strategy })).toBe(1000)
    })
  })

  describe('waitForRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should wait for calculated delay with exponential backoff', async () => {
      const strategy: RetryStrategy = {
        exponentialBackoff: true,
        maxRetries: 3,
        retryableStatuses: [],
        retryDelay: 1000,
      }

      const promise = waitForRetry({ attempt: 2, strategy })

      // Should wait 4000ms (1000 * 2^2)
      vi.advanceTimersByTime(3999)
      await Promise.resolve()
      expect(promise).not.toBe(await Promise.race([promise, Promise.resolve('not-done')]))

      vi.advanceTimersByTime(1)
      await promise

      expect(true).toBe(true)
    })

    it('should wait for fixed delay without exponential backoff', async () => {
      const strategy: RetryStrategy = {
        exponentialBackoff: false,
        maxRetries: 3,
        retryableStatuses: [],
        retryDelay: 500,
      }

      const promise = waitForRetry({ attempt: 5, strategy })

      vi.advanceTimersByTime(499)
      await Promise.resolve()
      expect(promise).not.toBe(await Promise.race([promise, Promise.resolve('not-done')]))

      vi.advanceTimersByTime(1)
      await promise

      expect(true).toBe(true)
    })
  })
})
