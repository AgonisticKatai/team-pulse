/**
 * Framework-Agnostic Error Handler
 *
 * Converts application errors to standardized error responses
 * without any framework dependencies (no Fastify, Express, etc.)
 *
 * This handler can be used across different contexts:
 * - HTTP APIs (via framework adapters)
 * - GraphQL resolvers
 * - WebSocket handlers
 * - Background jobs
 * - CLI applications
 */

import type { ErrorCategory } from './core.js'
import { ApplicationError } from './core.js'

/**
 * Framework-agnostic error response
 *
 * This is a pure data structure that represents an error response.
 * Framework adapters (Fastify, Express, etc.) convert this to
 * framework-specific responses.
 */
export interface ErrorResponse {
	/**
	 * HTTP status code (or equivalent in other contexts)
	 */
	statusCode: number

	/**
	 * Response body
	 */
	body: {
		/**
		 * Always false for error responses
		 */
		success: false

		/**
		 * Error information safe to expose to clients
		 */
		error: {
			/**
			 * Machine-readable error code (e.g., 'VALIDATION_ERROR')
			 * Can be used for i18n or programmatic handling
			 */
			code: string

			/**
			 * Human-readable error message
			 * Safe to display to end users for operational errors
			 */
			message: string

			/**
			 * Additional error details (optional)
			 * Only included for operational errors with metadata
			 */
			details?: Record<string, unknown>
		}
	}
}

/**
 * Category to HTTP status code mapping
 *
 * Each error category maps to a specific HTTP status code.
 * This is the single source of truth for error → status mapping.
 */
const CATEGORY_TO_HTTP_STATUS: Record<ErrorCategory, number> = {
	validation: 400, // Bad Request
	authentication: 401, // Unauthorized
	authorization: 403, // Forbidden
	not_found: 404, // Not Found
	conflict: 409, // Conflict
	business_rule: 422, // Unprocessable Entity
	external: 502, // Bad Gateway
	internal: 500, // Internal Server Error
}

/**
 * Framework-Agnostic Error Handler
 *
 * Converts any error to a standardized ErrorResponse without
 * depending on any specific framework (Fastify, Express, etc.)
 *
 * Handles:
 * - ApplicationError instances (domain errors)
 * - Zod validation errors
 * - Unknown errors (bugs, exceptions)
 *
 * Security:
 * - Operational errors: Full error details exposed
 * - Programming errors: Details hidden, generic message shown
 *
 * @example
 * ```typescript
 * // In a route handler
 * try {
 *   const result = await useCase.execute(dto)
 *   if (!result.ok) {
 *     const errorResponse = ErrorHandler.toResponse(result.error)
 *     return reply.code(errorResponse.statusCode).send(errorResponse.body)
 *   }
 * } catch (error) {
 *   const errorResponse = ErrorHandler.toResponse(error)
 *   return reply.code(errorResponse.statusCode).send(errorResponse.body)
 * }
 * ```
 */
export class ErrorHandler {
	/**
	 * Convert any error to standardized error response
	 *
	 * This is the main entry point for error handling.
	 * It determines the error type and delegates to specialized handlers.
	 *
	 * @param error - Any error (ApplicationError, ZodError, Error, unknown)
	 * @returns Standardized error response ready for serialization
	 */
	static toResponse(error: unknown): ErrorResponse {
		// Handle ApplicationError instances (our domain errors)
		if (error instanceof ApplicationError) {
			return this.handleApplicationError(error)
		}

		// Handle Zod validation errors
		if (this.isZodError(error)) {
			return this.handleZodError(error)
		}

		// Handle unknown errors (bugs, exceptions, etc.)
		return this.handleUnknownError(error)
	}

	/**
	 * Handle ApplicationError instances
	 *
	 * For operational errors: expose full error details
	 * For programming errors: hide details, show generic message
	 *
	 * @private
	 */
	private static handleApplicationError(error: ApplicationError): ErrorResponse {
		const statusCode = CATEGORY_TO_HTTP_STATUS[error.category]

		// Operational errors: safe to expose details to users
		if (error.isOperational) {
			// Filter out undefined values from metadata
			const filteredMetadata = Object.fromEntries(
				Object.entries(error.metadata).filter(([_, value]) => value !== undefined)
			)

			return {
				statusCode,
				body: {
					success: false,
					error: {
						code: error.code,
						message: error.message,
						// Only include details if metadata has actual values
						...(Object.keys(filteredMetadata).length > 0 && {
							details: filteredMetadata,
						}),
					},
				},
			}
		}

		// Programming errors (bugs): hide details, show generic message
		// This prevents leaking sensitive information to users
		return {
			statusCode,
			body: {
				success: false,
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
		}
	}

	/**
	 * Handle Zod validation errors
	 *
	 * Zod errors are converted to a validation error response
	 * with details about the first validation failure.
	 *
	 * @private
	 */
	private static handleZodError(error: { errors: Array<{ path: (string | number)[]; message: string }> }): ErrorResponse {
		const firstError = error.errors[0]
		const field = firstError?.path.join('.') || 'unknown'
		const message = firstError?.message || 'Validation failed'

		return {
			statusCode: 400,
			body: {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message,
					details: {
						field,
						errors: error.errors,
					},
				},
			},
		}
	}

	/**
	 * Handle unknown errors (exceptions, bugs, etc.)
	 *
	 * These are unexpected errors that should be logged and monitored.
	 * Details are hidden from users for security.
	 *
	 * @private
	 */
	private static handleUnknownError(_error: unknown): ErrorResponse {
		// In production, we should log the full error here
		// but only return a generic message to the user
		return {
			statusCode: 500,
			body: {
				success: false,
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred',
				},
			},
		}
	}

	/**
	 * Check if error is a Zod validation error
	 *
	 * @private
	 */
	private static isZodError(error: unknown): error is { errors: Array<{ path: (string | number)[]; message: string }> } {
		// Check if it's an Error instance with ZodError name
		if (error instanceof Error && error.name === 'ZodError' && 'errors' in error) {
			return Array.isArray((error as { errors: unknown }).errors)
		}

		// Also check if it's a plain object with ZodError shape (for testing)
		if (error && typeof error === 'object' && 'name' in error && 'errors' in error) {
			return (error as { name: unknown }).name === 'ZodError' && Array.isArray((error as { errors: unknown }).errors)
		}

		return false
	}

	/**
	 * Get HTTP status code for an error category
	 *
	 * Useful for testing or when you need just the status code
	 *
	 * @param category - Error category
	 * @returns HTTP status code
	 */
	static getStatusCode(category: ErrorCategory): number {
		return CATEGORY_TO_HTTP_STATUS[category]
	}
}
