/**
 * Core Error System
 *
 * Framework-agnostic error handling foundation that provides:
 * - Type-safe error categories and severity levels
 * - Rich error context with metadata
 * - Integration with Result<T,E> pattern
 * - Production-ready error handling (operational vs programming errors)
 *
 * This is the foundation of TeamPulse's error management system.
 * All domain errors extend from ApplicationError.
 */

/**
 * Error severity for logging, monitoring and alerting
 *
 * - low: Expected errors, minimal impact (validation failures)
 * - medium: Business rule violations, auth failures
 * - high: External service failures, degraded functionality
 * - critical: System failures, data corruption, security breaches
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error category - semantic classification for HTTP mapping
 *
 * Each category maps to a specific HTTP status code:
 * - validation: 400 Bad Request
 * - authentication: 401 Unauthorized
 * - authorization: 403 Forbidden
 * - not_found: 404 Not Found
 * - conflict: 409 Conflict
 * - business_rule: 422 Unprocessable Entity
 * - external: 502 Bad Gateway
 * - internal: 500 Internal Server Error
 */
export type ErrorCategory =
	| 'validation'
	| 'authentication'
	| 'authorization'
	| 'not_found'
	| 'conflict'
	| 'business_rule'
	| 'external'
	| 'internal'

/**
 * Base interface for all application errors
 *
 * This interface is framework-agnostic and can be implemented
 * by any error class. It provides rich error context while
 * remaining serializable and type-safe.
 */
export interface IApplicationError {
	/**
	 * Unique error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
	 * Used for programmatic error handling and i18n
	 */
	readonly code: string

	/**
	 * Human-readable error message
	 * Safe to expose to end users for operational errors
	 */
	readonly message: string

	/**
	 * Semantic error category
	 * Determines HTTP status code and handling strategy
	 */
	readonly category: ErrorCategory

	/**
	 * Error severity level
	 * Determines logging level and alerting thresholds
	 */
	readonly severity: ErrorSeverity

	/**
	 * Timestamp when error was created
	 * Useful for debugging and correlation
	 */
	readonly timestamp: Date

	/**
	 * Additional error context and metadata
	 * Can include field names, validation details, entity IDs, etc.
	 */
	readonly metadata?: Record<string, unknown>

	/**
	 * Whether this error is operational (expected) or programming (bug)
	 *
	 * Operational errors:
	 * - Expected in normal operation
	 * - Safe to expose to users
	 * - Examples: validation failures, not found, conflicts
	 *
	 * Programming errors:
	 * - Unexpected bugs or system failures
	 * - Should NOT be exposed to users
	 * - Examples: null pointer, database connection failure
	 */
	readonly isOperational: boolean

	/**
	 * Original error that caused this error (if any)
	 * Preserves the error chain for debugging
	 */
	readonly cause?: Error

	/**
	 * Add context to the error
	 *
	 * Useful for adding information as the error bubbles up the stack
	 * without losing the original error information.
	 *
	 * @example
	 * ```typescript
	 * const error = ValidationError.forField('email', 'Invalid format')
	 * const enriched = error.withContext({ userId: '123', requestId: 'abc' })
	 * ```
	 */
	withContext(context: Record<string, unknown>): IApplicationError

	/**
	 * Convert error to plain object for serialization
	 * Useful for logging, monitoring, and API responses
	 */
	toJSON(): object
}

/**
 * Base implementation of IApplicationError
 *
 * Provides common functionality for all application errors:
 * - Automatic timestamp generation
 * - Stack trace preservation
 * - Error chain support (cause)
 * - Metadata management
 * - JSON serialization
 *
 * All domain-specific errors should extend this class.
 *
 * @example
 * ```typescript
 * export class ValidationError extends ApplicationError {
 *   readonly code = 'VALIDATION_ERROR'
 *   readonly category = 'validation' as const
 *
 *   private constructor(params: { message: string; field?: string }) {
 *     super({
 *       message: params.message,
 *       severity: 'low',
 *       metadata: { field: params.field },
 *       isOperational: true,
 *     })
 *   }
 *
 *   static forField(field: string, message: string): ValidationError {
 *     return new ValidationError({ message, field })
 *   }
 * }
 * ```
 */
export abstract class ApplicationError extends Error implements IApplicationError {
	/**
	 * Unique error code - must be defined by subclasses
	 */
	abstract readonly code: string

	/**
	 * Semantic error category - must be defined by subclasses
	 */
	abstract readonly category: ErrorCategory

	/**
	 * When the error occurred
	 */
	readonly timestamp: Date

	/**
	 * Error severity level
	 */
	readonly severity: ErrorSeverity

	/**
	 * Additional error context
	 */
	readonly metadata: Record<string, unknown>

	/**
	 * Whether error is operational (expected) or programming (bug)
	 */
	readonly isOperational: boolean

	/**
	 * Original error that caused this error
	 */
	readonly cause?: Error

	/**
	 * Protected constructor - use factory methods in subclasses
	 *
	 * @param params - Error configuration
	 */
	protected constructor({
		message,
		severity = 'medium',
		metadata = {},
		isOperational = true,
		cause,
	}: {
		message: string
		severity?: ErrorSeverity
		metadata?: Record<string, unknown>
		isOperational?: boolean
		cause?: Error
	}) {
		super(message, { cause })

		// Set error name to class name for better debugging
		this.name = this.constructor.name

		// Initialize properties
		this.timestamp = new Date()
		this.severity = severity
		this.metadata = metadata
		this.isOperational = isOperational
		this.cause = cause

		// Preserve stack trace
		Error.captureStackTrace(this, this.constructor)
	}

	/**
	 * Add context to the error without losing original information
	 *
	 * Creates a new error instance with merged metadata.
	 * Original error remains unchanged.
	 */
	withContext(context: Record<string, unknown>): this {
		// Create new instance with merged metadata
		const ErrorClass = this.constructor as new (params: {
			message: string
			severity: ErrorSeverity
			metadata: Record<string, unknown>
			isOperational: boolean
			cause?: Error
		}) => this

		return new ErrorClass({
			message: this.message,
			severity: this.severity,
			metadata: { ...this.metadata, ...context },
			isOperational: this.isOperational,
			cause: this.cause,
		})
	}

	/**
	 * Convert error to plain object for serialization
	 *
	 * Useful for:
	 * - Logging systems
	 * - Monitoring/APM tools
	 * - Error reporting services
	 * - API error responses
	 */
	toJSON(): object {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			category: this.category,
			severity: this.severity,
			timestamp: this.timestamp.toISOString(),
			metadata: this.metadata,
			isOperational: this.isOperational,
			...(this.stack && { stack: this.stack }),
			...(this.cause && { cause: this.cause }),
		}
	}
}
