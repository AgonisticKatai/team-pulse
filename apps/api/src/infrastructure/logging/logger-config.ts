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
