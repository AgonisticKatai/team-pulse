/**
 * ExternalServiceError - Represents external service failures (502 Bad Gateway)
 *
 * Used when external service/API call fails
 *
 * @module errors/ExternalServiceError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class ExternalServiceError extends ApplicationError {
  readonly code = ERROR_CODES.EXTERNAL_SERVICE_ERROR
  readonly category = ERROR_CATEGORY.EXTERNAL

  private constructor({
    message,
    severity = ERROR_SEVERITY.HIGH,
    metadata,
  }: {
    message: string
    severity?: ErrorSeverity
    metadata?: Record<string, unknown>
  }) {
    super({
      isOperational: true,
      message,
      metadata,
      severity,
    })
  }

  /**
   * Create an external service error
   */
  static create({ message, service, metadata }: { message: string; service?: string; metadata?: Record<string, unknown> }): ExternalServiceError {
    return new ExternalServiceError({
      message,
      metadata: {
        ...metadata,
        ...(service && { service }),
      },
    })
  }
}
