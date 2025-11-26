/**
 * Error Handler Module
 *
 * Framework-agnostic error handling infrastructure
 */

export type { ErrorHandlerResult } from './error-handler.js'

// Error Handler
export { ErrorHandler } from './error-handler.js'
export type { ErrorResponse } from './error-response.js'

// Error Response
export { createSafeErrorResponse } from './error-response.js'
export type { HttpStatus } from './http-status-codes.js'

// HTTP Status Codes
export {
  ERROR_CATEGORY_TO_HTTP_STATUS,
  getHttpStatusForCategory,
  HTTP_STATUS,
} from './http-status-codes.js'

export type { ILogger, LogContext } from './logger.js'

// Logger
export {
  ConsoleLogger,
  getLogLevelForSeverity,
  NoOpLogger,
  SEVERITY_TO_LOG_LEVEL,
} from './logger.js'
