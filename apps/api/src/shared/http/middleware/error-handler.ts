import { ErrorHandler, type ILogger } from '@team-pulse/shared'
import type { FastifyReply } from 'fastify'

/**
 * Fastify Error Handler Middleware
 *
 * Integrates the framework-agnostic ErrorHandler from @team-pulse/shared
 * with Fastify's reply system.
 *
 * Architecture:
 * - Uses ErrorHandler from shared package (framework-agnostic core)
 * - Adapts ErrorResponse to Fastify reply format
 * - Provides convenient handleError function for routes
 *
 * Usage in routes:
 * ```typescript
 * try {
 *   const result = await useCase.execute(dto)
 *   if (!result.ok) {
 *     return handleError({ error: result.error, reply, logger })
 *   }
 *   return reply.send({ success: true, data: result.value })
 * } catch (error) {
 *   return handleError({ error, reply, logger })
 * }
 * ```
 */

/**
 * Handle error and send appropriate HTTP response
 *
 * @param error - The error to handle (can be ApplicationError or unknown)
 * @param reply - Fastify reply object
 * @param logger - Logger instance (ILogger interface)
 */
export function handleError({
  error,
  reply,
  logger,
}: {
  error: unknown
  reply: FastifyReply
  logger: ILogger
}): FastifyReply {
  // Use framework-agnostic ErrorHandler from shared package
  const errorHandler = ErrorHandler.create({ logger })
  const result = errorHandler.handle({ error })

  // Adapt ErrorHandlerResult to Fastify reply format
  return reply.code(result.statusCode).send({
    error: {
      code: result.response.code,
      message: result.response.message,
    },
    success: false,
  })
}
