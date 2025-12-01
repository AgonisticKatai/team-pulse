/**
 * Metrics Configuration
 *
 * This file defines all valid values for metric labels as const arrays.
 * These arrays serve as the single source of truth for type derivation.
 *
 * Domain Layer - Configuration
 */

/**
 * Valid HTTP methods for metrics
 */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

/**
 * Valid HTTP error types for error metrics
 */
export const HTTP_ERROR_TYPES = ['client_error', 'server_error'] as const

/**
 * Valid database operations for metrics
 */
export const DB_OPERATIONS = ['select', 'insert', 'update', 'delete'] as const

/**
 * Valid database tables for metrics
 */
export const DB_TABLES = ['users', 'teams', 'refresh_tokens'] as const

/**
 * Valid user roles for login metrics
 */
export const USER_ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const

/**
 * Metric label keys (using snake_case for Prometheus compatibility)
 */
export const METRIC_LABEL_KEYS = {
  ERROR_TYPE: 'error_type',
  METHOD: 'method',
  OPERATION: 'operation',
  ROLE: 'role',
  ROUTE: 'route',
  STATUS_CODE: 'status_code',
  TABLE: 'table',
} as const

/**
 * HTTP Metrics Configuration
 */
export const HTTP_METRICS = {
  REQUEST_DURATION: {
    help: 'Duration of HTTP requests in seconds',
    labelNames: [METRIC_LABEL_KEYS.METHOD, METRIC_LABEL_KEYS.ROUTE, METRIC_LABEL_KEYS.STATUS_CODE] as const,
    name: 'http_request_duration_seconds',
  },
  REQUEST_ERRORS: {
    help: 'Total number of HTTP request errors',
    labelNames: [METRIC_LABEL_KEYS.METHOD, METRIC_LABEL_KEYS.ROUTE, METRIC_LABEL_KEYS.ERROR_TYPE] as const,
    name: 'http_request_errors_total',
  },
  REQUEST_TOTAL: {
    help: 'Total number of HTTP requests',
    labelNames: [METRIC_LABEL_KEYS.METHOD, METRIC_LABEL_KEYS.ROUTE, METRIC_LABEL_KEYS.STATUS_CODE] as const,
    name: 'http_requests_total',
  },
} as const

/**
 * Database Metrics Configuration
 */
export const DB_METRICS = {
  QUERY_DURATION: {
    help: 'Duration of database queries in seconds',
    labelNames: [METRIC_LABEL_KEYS.OPERATION, METRIC_LABEL_KEYS.TABLE] as const,
    name: 'db_query_duration_seconds',
  },
  QUERY_ERRORS: {
    help: 'Total number of database query errors',
    labelNames: [METRIC_LABEL_KEYS.OPERATION, METRIC_LABEL_KEYS.TABLE, METRIC_LABEL_KEYS.ERROR_TYPE] as const,
    name: 'db_query_errors_total',
  },
  QUERY_TOTAL: {
    help: 'Total number of database queries',
    labelNames: [METRIC_LABEL_KEYS.OPERATION, METRIC_LABEL_KEYS.TABLE] as const,
    name: 'db_queries_total',
  },
} as const

/**
 * Business Metrics Configuration
 */
export const BUSINESS_METRICS = {
  LOGINS_TOTAL: {
    help: 'Total number of successful logins',
    labelNames: [METRIC_LABEL_KEYS.ROLE] as const,
    name: 'logins_total',
  },
  TEAMS_TOTAL: {
    help: 'Total number of teams in the system',
    name: 'teams_total',
  },
  USERS_TOTAL: {
    help: 'Total number of users in the system',
    name: 'users_total',
  },
} as const

/**
 * All metric configurations combined
 */
export const METRIC_CONFIG = {
  BUSINESS: BUSINESS_METRICS,
  DB: DB_METRICS,
  HTTP: HTTP_METRICS,
} as const
