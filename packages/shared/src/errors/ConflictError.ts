/**
 * ConflictError - Represents resource conflict (409 Conflict)
 *
 * Used when operation conflicts with current state (e.g., duplicate resources)
 *
 * @module errors/ConflictError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class ConflictError extends ApplicationError {
  readonly code = ERROR_CODES.CONFLICT_ERROR
  readonly category = ERROR_CATEGORY.CONFLICT

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
   * Create a generic conflict error
   */
  static create({ message, metadata }: { message: string; metadata?: Record<string, unknown> }): ConflictError {
    return new ConflictError({ message, metadata })
  }

  /**
   * Create an error for duplicate resource
   */
  static duplicate({ resource, identifier }: { resource: string; identifier: string }): ConflictError {
    return new ConflictError({
      message: `${resource} already exists`,
      metadata: {
        identifier,
        reason: 'duplicate',
        resource,
      },
    })
  }
}
