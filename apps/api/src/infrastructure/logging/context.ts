import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Request Context Storage using AsyncLocalStorage
 *
 * This provides request-scoped storage that persists across async operations
 * without needing to pass context explicitly through function calls.
 *
 * AsyncLocalStorage is a built-in Node.js feature that creates isolated storage
 * for each async execution context (e.g., each HTTP request).
 *
 * Use cases:
 * - Correlation IDs for distributed tracing
 * - User context for authorization
 * - Request metadata for logging
 *
 * Performance:
 * - Minimal overhead (~1-2% in most applications)
 * - Much more efficient than REQUEST scope in DI containers
 * - Thread-safe by design
 */

export interface RequestContext {
  correlationId: string
  requestId: string
}

/**
 * Global AsyncLocalStorage instance for request context
 *
 * This storage is:
 * - Thread-safe: Each async context gets its own isolated storage
 * - Automatic: No need to manually propagate context through function calls
 * - Compatible: Works seamlessly with async/await, promises, callbacks
 */
export const requestContextStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Get the current request context
 *
 * Returns the context for the current async execution context (request).
 * If called outside of a request context, returns undefined.
 *
 * @returns The current request context or undefined
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}

/**
 * Get the correlation ID from the current request context
 *
 * Convenience function to get just the correlation ID without accessing
 * the full context object.
 *
 * @returns The correlation ID or undefined if outside request context
 */
export function getCorrelationId(): string | undefined {
  return requestContextStorage.getStore()?.correlationId
}

/**
 * Get the request ID from the current request context
 *
 * Convenience function to get just the request ID without accessing
 * the full context object.
 *
 * @returns The request ID or undefined if outside request context
 */
export function getRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId
}
