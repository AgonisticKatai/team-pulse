import type { FastifyBaseLogger } from 'fastify'
import type { PinoLoggerOptions } from 'fastify/types/logger.js'

/**
 * Logger Configuration for Fastify/Pino
 *
 * Provides structured logging with:
 * - JSON format in production
 * - Pretty print in development
 * - Correlation IDs for request tracing
 * - Standardized log levels
 */

/**
 * Create logger configuration based on environment
 *
 * Development:
 * - Pretty printed logs with colors
 * - Human-readable format
 * - Includes timestamp
 *
 * Production:
 * - JSON structured logs
 * - Machine-parseable
 * - Optimized for log aggregation (e.g., CloudWatch, Datadog)
 */
export function createLoggerConfig(env: 'development' | 'production' | 'test', logLevel: string): PinoLoggerOptions | boolean {
  // Disable logging in tests
  if (env === 'test') {
    return false
  }

  const baseConfig: PinoLoggerOptions = {
    level: logLevel,
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
        // Include correlation ID if present
        correlationId: req.headers['x-correlation-id'],
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
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          // Show correlation ID in logs
          messageFormat: '{correlationId} {msg}',
        },
      },
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
