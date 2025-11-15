import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a unique correlation ID for each request.
 * The correlation ID:
 * - Tracks a request through the entire system
 * - Appears in all logs for that request
 * - Can be passed to external services
 * - Helps debug issues in production
 *
 * Usage:
 * ```typescript
 * fastify.addHook('onRequest', correlationIdHook)
 * ```
 *
 * Clients can send their own correlation ID via the `X-Correlation-ID` header.
 * If not provided, a new UUID is generated.
 */

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

/**
 * Correlation ID Hook
 *
 * Runs before each request to:
 * 1. Extract correlation ID from header (if present)
 * 2. Generate new UUID if not present
 * 3. Attach to request object
 * 4. Add to response headers
 * 5. Include in child logger for automatic logging
 */
export function correlationIdHook(request: FastifyRequest, reply: FastifyReply): void {
  // Try to get correlation ID from request header
  const headerCorrelationId = request.headers['x-correlation-id']

  // Use existing correlation ID or generate new one
  const correlationId =
    typeof headerCorrelationId === 'string'
      ? headerCorrelationId
      : Array.isArray(headerCorrelationId) && headerCorrelationId[0]
        ? headerCorrelationId[0]
        : randomUUID()

  // Attach to request object for easy access in handlers
  request.correlationId = correlationId

  // Add to response headers so clients can track their requests
  reply.header('X-Correlation-ID', correlationId)

  // Create child logger with correlation ID
  // This ensures all logs for this request include the correlation ID
  request.log = request.log.child({ correlationId })
}
