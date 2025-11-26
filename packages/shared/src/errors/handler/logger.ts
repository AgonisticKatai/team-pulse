/**
 * Logger Interface
 *
 * Framework-agnostic logging interface for error handling
 */

import type { ErrorSeverity } from '../core.js'

/**
 * Log context metadata
 */
export interface LogContext {
  readonly [key: string]: unknown
}

/**
 * Framework-agnostic logger interface
 *
 * Can be implemented with any logging library (winston, pino, console, etc.)
 */
export interface ILogger {
  /**
   * Log an error message
   */
  error({ message, context }: { message: string; context?: LogContext }): void

  /**
   * Log a warning message
   */
  warn({ message, context }: { message: string; context?: LogContext }): void

  /**
   * Log an info message
   */
  info({ message, context }: { message: string; context?: LogContext }): void

  /**
   * Log a debug message
   */
  debug({ message, context }: { message: string; context?: LogContext }): void
}

/**
 * Maps error severity to logger method
 */
export const SEVERITY_TO_LOG_LEVEL = {
  low: 'info',
  medium: 'warn',
  high: 'error',
  critical: 'error',
} as const

/**
 * Get log level for an error severity
 */
export function getLogLevelForSeverity({ severity }: { severity: ErrorSeverity }): 'error' | 'warn' | 'info' | 'debug' {
  return SEVERITY_TO_LOG_LEVEL[severity]
}

/**
 * Console-based logger implementation for development/testing
 */
export class ConsoleLogger implements ILogger {
  error({ message, context }: { message: string; context?: LogContext }): void {
    // biome-ignore lint/suspicious/noConsole: ConsoleLogger implements ILogger using console methods
    console.error(message, context ?? {})
  }

  warn({ message, context }: { message: string; context?: LogContext }): void {
    // biome-ignore lint/suspicious/noConsole: ConsoleLogger implements ILogger using console methods
    console.warn(message, context ?? {})
  }

  info({ message, context }: { message: string; context?: LogContext }): void {
    // biome-ignore lint/suspicious/noConsole: ConsoleLogger implements ILogger using console methods
    console.info(message, context ?? {})
  }

  debug({ message, context }: { message: string; context?: LogContext }): void {
    // biome-ignore lint/suspicious/noConsole: ConsoleLogger implements ILogger using console methods
    console.debug(message, context ?? {})
  }
}
/**
 * No-op logger implementation for testing
 */
export class NoOpLogger implements ILogger {
  error(_params: { message: string; context?: LogContext }): void {
    // No-op
  }

  warn(_params: { message: string; context?: LogContext }): void {
    // No-op
  }

  info(_params: { message: string; context?: LogContext }): void {
    // No-op
  }

  debug(_params: { message: string; context?: LogContext }): void {
    // No-op
  }
}
