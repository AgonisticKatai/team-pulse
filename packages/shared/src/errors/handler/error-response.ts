/**
 * Error Response
 *
 * Type-safe error response structure for API responses
 */

import type { ErrorCategory, ErrorSeverity } from '../core.js'

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  readonly name: string
  readonly message: string
  readonly code: string
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly timestamp: string
  readonly metadata?: Record<string, unknown>
}

/**
 * Creates a safe error response from an error object
 *
 * For operational errors: Returns full error details including metadata
 * For non-operational errors: Returns sanitized message without internal details
 */
export function createSafeErrorResponse({
  error,
}: {
  error: {
    name: string
    message: string
    code: string
    category: ErrorCategory
    severity: ErrorSeverity
    timestamp: Date
    isOperational: boolean
    metadata?: Record<string, unknown>
  }
}): ErrorResponse {
  // For operational errors, return full details
  if (error.isOperational) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp.toISOString(),
      ...(error.metadata && { metadata: error.metadata }),
    }
  }

  // For non-operational errors (programming errors), hide internal details
  return {
    name: 'InternalError',
    message: 'An unexpected error occurred',
    code: error.code,
    category: error.category,
    severity: error.severity,
    timestamp: error.timestamp.toISOString(),
  }
}
