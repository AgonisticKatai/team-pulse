/**
 * Error Handler
 *
 * Framework-agnostic error handler for processing ApplicationError instances
 */

import type { IApplicationError } from '../core.js'
import { InternalError } from '../index.js'
import { createSafeErrorResponse, type ErrorResponse } from './error-response.js'
import { getHttpStatusForCategory } from './http-status-codes.js'
import { getLogLevelForSeverity, type ILogger } from './logger.js'

/**
 * Result of error handling
 */
export interface ErrorHandlerResult {
  readonly statusCode: number
  readonly response: ErrorResponse
}

/**
 * Framework-agnostic error handler
 *
 * Processes errors and generates safe HTTP responses with structured logging
 */
export class ErrorHandler {
  private readonly logger: ILogger

  private constructor({ logger }: { logger: ILogger }) {
    this.logger = logger
  }

  /**
   * Create an error handler instance
   */
  static create({ logger }: { logger: ILogger }): ErrorHandler {
    return new ErrorHandler({ logger })
  }

  /**
   * Handle an error and return HTTP response details
   *
   * - Maps error category to HTTP status code
   * - Generates safe error response (hides internals for non-operational errors)
   * - Logs error with appropriate severity level
   * - Converts unknown errors to InternalError
   */
  handle({ error }: { error: unknown }): ErrorHandlerResult {
    // Convert unknown errors to InternalError
    const appError = this.normalizeError({ error })

    // Log the error with appropriate severity
    this.logError({ error: appError })

    // Generate safe error response
    const response = createSafeErrorResponse({ error: appError })

    // Map to HTTP status code
    const statusCode = getHttpStatusForCategory({ category: appError.category })

    return {
      statusCode,
      response,
    }
  }

  /**
   * Normalize any error to an ApplicationError
   */
  private normalizeError({ error }: { error: unknown }): IApplicationError {
    // Already an ApplicationError
    if (this.isApplicationError(error)) {
      return error
    }

    // Standard Error
    if (error instanceof Error) {
      return InternalError.fromError({ error })
    }

    // Unknown error type
    return InternalError.create({
      message: 'An unexpected error occurred',
      metadata: {
        originalError: String(error),
      },
    })
  }

  /**
   * Log error with appropriate severity level
   */
  private logError({ error }: { error: IApplicationError }): void {
    const logLevel = getLogLevelForSeverity({ severity: error.severity })
    const context = {
      code: error.code,
      category: error.category,
      severity: error.severity,
      isOperational: error.isOperational,
      timestamp: error.timestamp.toISOString(),
      ...(error.metadata && { metadata: error.metadata }),
    }

    // Log based on severity
    switch (logLevel) {
      case 'error':
        this.logger.error({ message: error.message, context })
        break
      case 'warn':
        this.logger.warn({ message: error.message, context })
        break
      case 'info':
        this.logger.info({ message: error.message, context })
        break
      case 'debug':
        this.logger.debug({ message: error.message, context })
        break
    }

    // For non-operational errors, log additional warning
    if (!error.isOperational) {
      this.logger.error({
        message: 'Non-operational error detected - possible programming error',
        context: {
          errorName: error.name,
          code: error.code,
        },
      })
    }
  }

  /**
   * Type guard to check if error is an ApplicationError
   */
  private isApplicationError(error: unknown): error is IApplicationError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error &&
      'category' in error &&
      'severity' in error &&
      'timestamp' in error &&
      'isOperational' in error
    )
  }
}
