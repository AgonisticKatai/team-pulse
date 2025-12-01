/**
 * NotFoundError - Represents resource not found (404 Not Found)
 *
 * Used when a requested resource doesn't exist
 *
 * @module errors/NotFoundError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class NotFoundError extends ApplicationError {
  readonly code = ERROR_CODES.NOT_FOUND_ERROR
  readonly category = ERROR_CATEGORY.NOT_FOUND

  private constructor({
    message,
    severity = ERROR_SEVERITY.LOW,
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
   * Create a generic not found error
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): NotFoundError {
    return new NotFoundError({ message, metadata })
  }

  /**
   * Create an error for a specific resource type
   */
  static forResource({ resource, identifier }: { resource: string; identifier: string }): NotFoundError {
    return new NotFoundError({
      message: `${resource} not found`,
      metadata: {
        identifier,
        resource,
      },
    })
  }
}
