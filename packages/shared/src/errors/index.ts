/**
 * Error System - Barrel export
 *
 * Exports all error-related types, classes, and constants.
 *
 * @module errors
 */

// Domain-specific errors
export { AuthenticationError } from './AuthenticationError.js'
export { AuthorizationError } from './AuthorizationError.js'
export { BusinessRuleError } from './BusinessRuleError.js'
export { ConflictError } from './ConflictError.js'
export type { ErrorCategory, ErrorCode, ErrorSeverity, IApplicationError } from './core.js'
// Core types and constants
export {
  ApplicationError,
  ERROR_CATEGORY,
  ERROR_CODES,
  ERROR_SEVERITY,
  isApplicationError,
  isIApplicationError,
} from './core.js'
export { ExternalServiceError } from './ExternalServiceError.js'
export { InternalError } from './InternalError.js'
export { NotFoundError } from './NotFoundError.js'
export { ValidationError } from './ValidationError.js'
