import { InternalError } from '@team-pulse/shared'
import type { RetryStrategy } from './http-client.types.js'

/**
 * Determine if request should be retried based on error and retry strategy
 */
export function shouldRetryRequest(params: {
  error: Error
  attempt: number
  maxRetries: number
  strategy: RetryStrategy
}): boolean {
  const { attempt, error, maxRetries, strategy } = params

  if (attempt >= maxRetries) return false

  if (strategy.shouldRetry) {
    return strategy.shouldRetry(error, attempt)
  }

  if (error instanceof InternalError && error.metadata?.status) {
    const status = error.metadata.status as number
    return strategy.retryableStatuses.includes(status)
  }

  return true
}

/**
 * Calculate retry delay with optional exponential backoff
 */
export function calculateRetryDelay(params: { attempt: number; strategy: RetryStrategy }): number {
  const { attempt, strategy } = params
  return strategy.exponentialBackoff ? strategy.retryDelay * 2 ** attempt : strategy.retryDelay
}

/**
 * Wait for retry delay
 */
export async function waitForRetry(params: { attempt: number; strategy: RetryStrategy }): Promise<void> {
  const delay = calculateRetryDelay(params)
  await new Promise((resolve) => setTimeout(resolve, delay))
}
