import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { RequestContext } from '../../logging/context.js'
import { requestContextStorage } from '../../logging/context.js'

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a unique correlation ID for each request and stores it
 * in AsyncLocalStorage for automatic injection into all logs.
 *
 * The correlation ID:
 * - Tracks a request through the entire system
 * - Appears automatically in ALL logs via Pino mixin
 * - Can be passed to external services
 * - Helps debug issues in production
 *
 * Usage in app.ts:
 * ```typescript
 * fastify.addHook('onRequest', correlationIdMiddleware)
 * ```
 *
 * Clients can send their own correlation ID via the `X-Correlation-ID` header.
 * If not provided, a new UUID is generated.
 *
 * How it works:
 * 1. Middleware extracts/generates correlation ID
 * 2. Stores it in AsyncLocalStorage
 * 3. Pino mixin reads from AsyncLocalStorage
 * 4. All logs automatically include correlationId field
 *
 * Benefits over child loggers:
 * - No deadlocks with pino-pretty
 * - No manual propagation needed
 * - Works across async boundaries
 * - Minimal performance overhead
 */

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

/**
 * Correlation ID middleware using AsyncLocalStorage
 *
 * This hook:
 * 1. Extracts or generates a correlation ID
 * 2. Stores it in AsyncLocalStorage for the request lifecycle
 * 3. Attaches it to the request object for easy access
 * 4. Adds it to response headers for client tracking
 *
 * The AsyncLocalStorage ensures the correlation ID is available to:
 * - All log calls (via Pino mixin)
 * - All async operations within the request
 * - Service layers without explicit passing
 */
export function correlationIdMiddleware(request: FastifyRequest, reply: FastifyReply): void {
  // Try to get correlation ID from request header
  const headerCorrelationId = request.headers['x-correlation-id']

  // Use existing correlation ID or generate new one
  const correlationId =
    typeof headerCorrelationId === 'string'
      ? headerCorrelationId
      : Array.isArray(headerCorrelationId) && headerCorrelationId[0]
        ? headerCorrelationId[0]
        : randomUUID()

  // Create request context
  const context: RequestContext = {
    correlationId,
    requestId: request.id, // Fastify's built-in request ID
  }

  // Use enterWith() to set context for the current async execution chain
  // This makes the context available for all subsequent async operations
  // in this request without needing a callback wrapper
  requestContextStorage.enterWith(context)

  // Attach to request object for direct access in handlers
  request.correlationId = correlationId

  // Add to response headers so clients can track their requests
  reply.header('X-Correlation-ID', correlationId)
}
