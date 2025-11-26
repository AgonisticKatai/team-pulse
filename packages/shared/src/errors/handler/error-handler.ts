/**
 * Error Handler
 *
 * Framework-agnostic error handler for processing ApplicationError instances
 */

import { ZodError } from 'zod'
import type { IApplicationError } from '../core.js'
import { AuthenticationError, ConflictError, InternalError, NotFoundError, ValidationError } from '../index.js'
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

    // Legacy domain errors (backward compatibility)
    const legacyError = this.convertLegacyDomainError({ error })
    if (legacyError) {
      return legacyError
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
   * Convert legacy domain errors to ApplicationErrors
   * This provides backward compatibility during migration
   */
  private convertLegacyDomainError({ error }: { error: unknown }): IApplicationError | null {
    if (typeof error !== 'object' || error === null) {
      return null
    }

    // Check if it's a legacy domain error (has code and isOperational but not category/severity/timestamp)
    const hasLegacyShape = 'code' in error && 'message' in error && 'isOperational' in error && !('category' in error) && !('severity' in error)

    if (!hasLegacyShape) {
      return null
    }

    const legacyError = error as {
      code: string
      message: string
      isOperational: boolean
      field?: string
      details?: Record<string, unknown>
    }

    // Legacy ValidationError with credentials field -> AuthenticationError
    if (legacyError.code === 'VALIDATION_ERROR' && (legacyError.field === 'credentials' || legacyError.field === 'refreshToken')) {
      return AuthenticationError.create({
        message: legacyError.message,
      })
    }

    // Legacy ValidationError -> ValidationError (new)
    if (legacyError.code === 'VALIDATION_ERROR') {
      return ValidationError.create({
        message: legacyError.message,
        metadata: legacyError.field ? { field: legacyError.field, ...legacyError.details } : legacyError.details,
      })
    }

    // Legacy DUPLICATED -> ConflictError
    if (legacyError.code === 'DUPLICATED') {
      return ConflictError.create({
        message: legacyError.message,
      })
    }

    // Legacy NOT_FOUND -> NotFoundError
    if (legacyError.code === 'NOT_FOUND') {
      // Special case: refresh token or user not found during auth -> AuthenticationError
      if (legacyError.message.includes('RefreshToken') || legacyError.message.includes('User')) {
        return AuthenticationError.create({
          message: 'Invalid or expired refresh token',
        })
      }
      return NotFoundError.create({
        message: legacyError.message,
      })
    }

    // Other legacy domain errors -> InternalError
    return null
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
