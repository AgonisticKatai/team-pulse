import { randomUUID } from 'node:crypto'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Correlation ID Middleware
 *
 * Generates or extracts a unique correlation ID for each request to enable
 * distributed tracing and request tracking across the system.
 *
 * Features:
 * - Extracts correlation ID from `X-Correlation-ID` header if provided
 * - Generates a new UUID if no correlation ID is provided
 * - Attaches correlation ID to request object for handler access
 * - Returns correlation ID in response headers for client tracking
 * - Appears in logs via Pino request serializer (see logger-config.ts)
 *
 * Usage:
 * ```typescript
 * fastify.addHook('onRequest', correlationIdMiddleware)
 * ```
 */

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

/**
 * Fastify onRequest hook that manages correlation IDs
 *
 * CRITICAL: Must be async for proper Fastify lifecycle integration with pino-pretty.
 * The async nature is required by Fastify's hook system, even without await expressions.
 *
 * @see https://fastify.dev/docs/latest/Reference/Hooks/#onrequest
 */
// biome-ignore lint/suspicious/useAwait: Async required for Fastify hook lifecycle with pino-pretty
export async function correlationIdMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Extract correlation ID from header or generate new UUID
  const headerCorrelationId = request.headers['x-correlation-id']

  const correlationId =
    typeof headerCorrelationId === 'string'
      ? headerCorrelationId
      : Array.isArray(headerCorrelationId) && headerCorrelationId[0]
        ? headerCorrelationId[0]
        : randomUUID()

  // Attach to request for handler access and logging
  request.correlationId = correlationId

  // Return in response headers for client tracking
  reply.header('X-Correlation-ID', correlationId)
}
