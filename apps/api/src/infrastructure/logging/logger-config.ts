import type { FastifyBaseLogger } from 'fastify'
import type { PinoLoggerOptions } from 'fastify/types/logger.js'

/**
 * Logger Configuration for Fastify/Pino
 *
 * Configures structured logging with environment-specific behavior:
 * - Development: Pretty-printed logs with colorization
 * - Production: JSON structured logs for aggregation
 * - Test: Silent logger to avoid stdout pollution
 *
 * Correlation IDs are automatically included in request logs via the
 * request serializer reading from request.correlationId.
 */

/**
 * Creates Pino logger configuration based on environment
 *
 * @param env - Application environment (development, production, test)
 * @param logLevel - Minimum log level to output (trace, debug, info, warn, error, fatal)
 * @returns Pino logger options or boolean (false disables logging)
 */
export function createLoggerConfig(env: 'development' | 'production' | 'test', logLevel: string): PinoLoggerOptions | boolean {
  // Test environment: silent logger to avoid polluting test output
  // Cannot return false - Fastify's inject() and lifecycle depend on logger infrastructure
  if (env === 'test') {
    return {
      level: 'silent',
    }
  }

  const baseConfig: PinoLoggerOptions = {
    level: logLevel,
    serializers: {
      err: (err: Error) => ({
        message: err.message,
        name: err.name,
        stack: err.stack,
        type: err.constructor.name,
      }),
      req: (req) => ({
        correlationId: req.correlationId, // Injected by correlation-id middleware
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
    return {
      ...baseConfig,
      transport: {
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss',
        },
        target: 'pino-pretty',
      },
    }
  }

  // Production: structured JSON logs for log aggregation systems
  return {
    ...baseConfig,
    base: {
      env: 'production',
      service: 'team-pulse-api',
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  }
}

/**
 * Logger interface for dependency injection
 * Allows mocking in tests and swapping implementations
 */
export type Logger = FastifyBaseLogger
