import type { FastifyBaseLogger } from 'fastify'
import type { PinoLoggerOptions } from 'fastify/types/logger.js'
import { getRequestContext } from './context.js'

/**
 * Logger Configuration for Fastify/Pino
 *
 * Provides structured logging with:
 * - JSON format in production
 * - Pretty print in development (via external piping)
 * - Automatic correlation IDs via AsyncLocalStorage + mixin
 * - Standardized log levels
 *
 * The correlation ID is automatically injected into ALL logs using:
 * 1. AsyncLocalStorage to store request context
 * 2. Pino mixin to read from storage and inject into logs
 *
 * This approach:
 * - Avoids child logger deadlocks with pino-pretty
 * - Eliminates manual correlation ID passing
 * - Works seamlessly across async operations
 * - Has minimal performance impact
 */

/**
 * Create logger configuration based on environment
 *
 * Development:
 * - JSON logs that can be piped to pino-pretty
 * - Automatic correlation IDs via mixin
 * - Human-readable when piped (e.g., pnpm dev | pino-pretty)
 *
 * Production:
 * - Structured JSON logs
 * - Machine-parseable
 * - Optimized for log aggregation (e.g., CloudWatch, Datadog)
 * - Automatic correlation IDs
 *
 * Test:
 * - Silent logs (no stdout pollution)
 * - Logger infrastructure enabled (required for Fastify lifecycle)
 * - No correlation IDs needed
 */
export function createLoggerConfig(env: 'development' | 'production' | 'test', logLevel: string): PinoLoggerOptions | boolean {
  // In test environment, use silent logger to avoid stdout pollution
  // We CANNOT return false because:
  // 1. Fastify's inject() method relies on logger infrastructure for request lifecycle
  // 2. Plugins and hooks may call request.log.* methods
  // 3. Returning false disables the entire logger, breaking internal Fastify mechanisms
  if (env === 'test') {
    return {
      level: 'silent', // Suppress output but keep logger functional
    }
  }

  const baseConfig: PinoLoggerOptions = {
    level: logLevel,
    /**
     * Mixin function - automatically called for every log
     *
     * This reads from AsyncLocalStorage and injects the correlation ID
     * into every log message. The mixin runs for ALL logs, ensuring
     * consistent correlation ID inclusion without manual intervention.
     *
     * Benefits:
     * - Automatic: No need to pass correlationId manually
     * - Safe: No child loggers = no deadlocks
     * - Consistent: All logs include correlation ID when available
     * - Clean: No cluttered code with manual correlation ID passing
     */
    mixin() {
      const context = getRequestContext()
      return context
        ? {
            correlationId: context.correlationId,
            reqId: context.requestId,
          }
        : {}
    },
    // Serialize errors properly
    serializers: {
      err: (err: Error) => ({
        message: err.message,
        name: err.name,
        stack: err.stack,
        type: err.constructor.name,
      }),
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }

  if (env === 'development') {
    // JSON logs in development - can be piped to pino-pretty for readability
    // Example: pnpm dev | pino-pretty
    //
    // We don't use pino-pretty as a transport because:
    // 1. It can cause issues with some setups
    // 2. External piping is more flexible
    // 3. You can choose when to use pretty printing
    return {
      ...baseConfig,
    }
  }

  // Production: JSON structured logs
  return {
    ...baseConfig,
    // Include timestamp in ISO format
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    // Add default fields for all logs
    base: {
      env: 'production',
      service: 'team-pulse-api',
    },
  }
}

/**
 * Logger interface for dependency injection
 * Allows mocking in tests and swapping implementations
 */
export type Logger = FastifyBaseLogger
