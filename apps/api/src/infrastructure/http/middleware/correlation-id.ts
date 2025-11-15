import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a unique correlation ID for each request.
 * The correlation ID:
 * - Tracks a request through the entire system
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
 * IMPORTANT: This implementation does NOT touch the logger to avoid deadlocks with pino-pretty.
 * To include correlation ID in logs, use:
 * ```typescript
 * request.log.info({ correlationId: request.correlationId }, 'User logged in')
 * ```
 */

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

/**
 * Simple middleware that adds correlationId to request
 * Does NOT touch logging to avoid issues
 * MUST be async to properly integrate with Fastify lifecycle
 */
export async function correlationIdMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Try to get correlation ID from request header
  const headerCorrelationId = request.headers['x-correlation-id']

  // Use existing correlation ID or generate new one
  const correlationId =
    typeof headerCorrelationId === 'string'
      ? headerCorrelationId
      : Array.isArray(headerCorrelationId) && headerCorrelationId[0]
        ? headerCorrelationId[0]
        : randomUUID()

  // Attach to request object
  request.correlationId = correlationId

  // Add to response headers so clients can track their requests
  await reply.header('X-Correlation-ID', correlationId)
}
