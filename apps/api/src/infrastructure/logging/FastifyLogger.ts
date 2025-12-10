import type { ILogger, LogContext } from '@team-pulse/shared'
import type { FastifyBaseLogger } from 'fastify'

/**
 * FastifyLogger Adapter
 *
 * Adapts Fastify's logger to implement ILogger interface from shared package.
 * This allows the framework-agnostic ErrorHandler to work with Fastify's logging system.
 *
 * Pattern: Adapter Pattern (Infrastructure → Domain)
 * - ILogger is the domain interface (framework-agnostic)
 * - FastifyLogger is the infrastructure adapter (Fastify-specific)
 *
 * Usage:
 * ```typescript
 * const logger = FastifyLogger.create({ logger: fastify.log })
 * const errorHandler = ErrorHandler.create({ logger })
 * ```
 */
export class FastifyLogger implements ILogger {
  private readonly logger: FastifyBaseLogger

  private constructor({ logger }: { logger: FastifyBaseLogger }) {
    this.logger = logger
  }

  static create({ logger }: { logger: FastifyBaseLogger }): FastifyLogger {
    return new FastifyLogger({ logger })
  }

  error({ message, context }: { message: string; context?: LogContext }): void {
    this.logger.error({ context: context ?? {} }, message)
  }

  warn({ message, context }: { message: string; context?: LogContext }): void {
    this.logger.warn({ context: context ?? {} }, message)
  }

  info({ message, context }: { message: string; context?: LogContext }): void {
    this.logger.info({ context: context ?? {} }, message)
  }

  debug({ message, context }: { message: string; context?: LogContext }): void {
    this.logger.debug({ context: context ?? {} }, message)
  }
}
