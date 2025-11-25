/**
 * Core Error System - Base types and classes for application-wide error handling
 *
 * This module provides the foundation for a type-safe, framework-agnostic error system
 * that can be shared across the entire monorepo (API, Web, etc.).
 *
 * @module errors/core
 */

/**
 * Severity levels for error classification and logging/monitoring purposes
 *
 * - `LOW`: Minor issues, typically don't require immediate attention
 * - `MEDIUM`: Standard errors that should be monitored
 * - `HIGH`: Serious errors requiring attention
 * - `CRITICAL`: Critical failures requiring immediate intervention
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

/**
 * Error severity type derived from ERROR_SEVERITY constant
 */
export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY]

/**
 * Error categories for semantic classification and HTTP status mapping
 *
 * Each category maps to a specific HTTP status code:
 * - `VALIDATION`: 400 Bad Request
 * - `AUTHENTICATION`: 401 Unauthorized
 * - `AUTHORIZATION`: 403 Forbidden
 * - `NOT_FOUND`: 404 Not Found
 * - `CONFLICT`: 409 Conflict
 * - `BUSINESS_RULE`: 422 Unprocessable Entity
 * - `EXTERNAL`: 502 Bad Gateway
 * - `INTERNAL`: 500 Internal Server Error
 */
export const ERROR_CATEGORY = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  BUSINESS_RULE: 'business_rule',
  EXTERNAL: 'external',
  INTERNAL: 'internal',
} as const

/**
 * Error category type derived from ERROR_CATEGORY constant
 */
export type ErrorCategory = (typeof ERROR_CATEGORY)[keyof typeof ERROR_CATEGORY]

/**
 * Error codes for identifying specific error types
 *
 * Each domain-specific error has a unique code for identification in logs,
 * monitoring, and error handling.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

/**
 * Error code type derived from ERROR_CODES constant
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Interface for all application errors
 *
 * Provides a consistent contract for error handling across the application.
 * All custom error classes should implement this interface.
 */
export interface IApplicationError {
  /** Unique error code for identification (e.g., 'VALIDATION_ERROR', 'AUTH_FAILED') */
  readonly code: string

  /** Human-readable error message */
  readonly message: string

  /** Semantic category for error classification and HTTP mapping */
  readonly category: ErrorCategory

  /** Severity level for logging and monitoring */
  readonly severity: ErrorSeverity

  /** Timestamp when the error was created */
  readonly timestamp: Date

  /** Additional contextual information about the error */
  readonly metadata?: Record<string, unknown>

  /**
   * Whether this error is operational (safe to expose to client)
   * - `true`: Business logic error, safe to show to users
   * - `false`: Programming error, should be hidden from users
   */
  readonly isOperational: boolean

  /**
   * Add additional context to the error
   * Returns a new error instance with merged metadata
   */
  withContext({ ctx }: { ctx: Record<string, unknown> }): IApplicationError

  /**
   * Serialize error to JSON format
   * Useful for logging, API responses, and debugging
   */
  toJSON(): object
}

/**
 * Base class for all application errors
 *
 * Extends native Error class and implements IApplicationError interface.
 * Uses private constructor + factory methods pattern for consistent error creation.
 *
 * @abstract
 * @example
 * ```typescript
 * export class ValidationError extends ApplicationError {
 *   readonly code = 'VALIDATION_ERROR'
 *   readonly category = 'validation' as const
 *
 *   private constructor(props: ApplicationErrorProps) {
 *     super(props)
 *   }
 *
 *   static create({ message, field }: { message: string; field?: string }): ValidationError {
 *     return new ValidationError({
 *       message,
 *       severity: 'low',
 *       metadata: field ? { field } : undefined,
 *       isOperational: true,
 *     })
 *   }
 * }
 * ```
 */
export abstract class ApplicationError extends Error implements IApplicationError {
  abstract readonly code: string
  abstract readonly category: ErrorCategory

  readonly severity: ErrorSeverity
  readonly timestamp: Date
  readonly metadata?: Record<string, unknown>
  readonly isOperational: boolean

  /**
   * Private constructor to enforce factory method pattern
   * Subclasses should use static factory methods for instantiation
   */
  protected constructor({
    message,
    severity,
    timestamp,
    metadata,
    isOperational,
  }: {
    message: string
    severity: ErrorSeverity
    timestamp?: Date
    metadata?: Record<string, unknown>
    isOperational: boolean
  }) {
    super(message)
    this.name = this.constructor.name
    this.severity = severity
    this.timestamp = timestamp ?? new Date()
    this.metadata = metadata
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Add additional context to the error
   * Returns a new error instance with merged metadata
   */
  withContext({ ctx }: { ctx: Record<string, unknown> }): this {
    const ErrorClass = this.constructor as new (props: {
      message: string
      severity: ErrorSeverity
      timestamp: Date
      metadata?: Record<string, unknown>
      isOperational: boolean
    }) => this

    return new ErrorClass({
      message: this.message,
      severity: this.severity,
      timestamp: this.timestamp,
      metadata: { ...this.metadata, ...ctx },
      isOperational: this.isOperational,
    })
  }

  /**
   * Serialize error to JSON format
   * Useful for logging, API responses, and debugging
   */
  toJSON(): object {
    const result: Record<string, unknown> = {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
    }

    // Only include metadata if it exists
    if (this.metadata) {
      result.metadata = this.metadata
    }

    return result
  }
}

/**
 * Type guard to check if an error is an ApplicationError
 *
 * Note: Type predicates cannot use destructuring in TypeScript,
 * so this function uses a positional parameter instead of named parameters.
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

/**
 * Type guard to check if an error implements IApplicationError
 *
 * Note: Type predicates cannot use destructuring in TypeScript,
 * so this function uses a positional parameter instead of named parameters.
 */
export function isIApplicationError(error: unknown): error is IApplicationError {
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
