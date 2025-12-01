/**
 * Error Handler
 *
 * Framework-agnostic error handler for processing ApplicationError instances
 */

import { ZodError } from 'zod'
import type { IApplicationError } from '../core.js'
import { InternalError, ValidationError } from '../index.js'
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
      response,
      statusCode,
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

    // Zod validation errors
    if (error instanceof ZodError) {
      return ValidationError.create({
        message: 'Invalid request data',
        metadata: {
          issues: error.issues,
        },
      })
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
      category: error.category,
      code: error.code,
      isOperational: error.isOperational,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      ...(error.metadata && { metadata: error.metadata }),
    }

    // Log based on severity
    switch (logLevel) {
      case 'error':
        this.logger.error({ context, message: error.message })
        break
      case 'warn':
        this.logger.warn({ context, message: error.message })
        break
      case 'info':
        this.logger.info({ context, message: error.message })
        break
      case 'debug':
        this.logger.debug({ context, message: error.message })
        break
    }

    // For non-operational errors, log additional warning
    if (!error.isOperational) {
      this.logger.error({
        context: {
          code: error.code,
          errorName: error.name,
        },
        message: 'Non-operational error detected - possible programming error',
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
