/**
 * Metrics Type Definitions
 *
 * This file contains TypeScript types derived from the metrics configuration.
 * All types are derived from the const arrays in metrics.config.ts, ensuring
 * compile-time type safety for all metric operations.
 *
 * Domain Layer - Types
 */

import type { DB_OPERATIONS, DB_TABLES, HTTP_ERROR_TYPES, HTTP_METHODS, USER_ROLES } from './metrics.config.js'

/**
 * Valid HTTP methods
 * @example 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
 */
export type HttpMethod = (typeof HTTP_METHODS)[number]

/**
 * Valid HTTP error types for metrics
 * @example 'client_error' | 'server_error'
 */
export type HttpErrorType = (typeof HTTP_ERROR_TYPES)[number]

/**
 * Valid database operations
 * @example 'select' | 'insert' | 'update' | 'delete'
 */
export type DbOperation = (typeof DB_OPERATIONS)[number]

/**
 * Valid database tables
 * @example 'users' | 'teams' | 'refresh_tokens'
 */
export type DbTable = (typeof DB_TABLES)[number]

/**
 * Valid user roles
 * @example 'USER' | 'ADMIN' | 'SUPER_ADMIN'
 */
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Parameters for recording HTTP request metrics
 */
export interface HttpRequestMetrics {
  /** HTTP method (GET, POST, etc.) */
  method: HttpMethod
  /** Route path (e.g., '/api/users') */
  route: string
  /** HTTP status code */
  statusCode: number
  /** Request duration in seconds */
  durationSeconds: number
}

/**
 * Parameters for recording HTTP error metrics
 */
export interface HttpErrorMetrics {
  /** HTTP method (GET, POST, etc.) */
  method: HttpMethod
  /** Route path */
  route: string
  /** Error type (client_error or server_error) */
  errorType: HttpErrorType
}

/**
 * Parameters for recording database query metrics
 */
export interface DbQueryMetrics {
  /** Database operation type */
  operation: DbOperation
  /** Database table name */
  table: DbTable
  /** Query duration in seconds */
  durationSeconds: number
}

/**
 * Parameters for recording database error metrics
 */
export interface DbErrorMetrics {
  /** Database operation type */
  operation: DbOperation
  /** Database table name */
  table: DbTable
  /** Error type description */
  errorType: string
}

/**
 * Parameters for recording login metrics
 */
export interface LoginMetrics {
  /** User role */
  role: UserRole
}

/**
 * Parameters for setting total counts
 */
export interface TotalCountMetrics {
  /** Total count value */
  count: number
}
