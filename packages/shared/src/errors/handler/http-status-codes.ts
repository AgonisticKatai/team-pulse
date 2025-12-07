/**
 * HTTP Status Codes
 *
 * Standard HTTP status codes mapped to error categories
 */

import { ERROR_CATEGORY } from '../core.js'

/**
 * HTTP status codes for error responses
 */
export const HTTP_STATUS = {
  BAD_GATEWAY: 502,

  // Client Errors
  BAD_REQUEST: 400,
  CONFLICT: 409,
  CREATED: 201,
  FORBIDDEN: 403,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  // Success
  OK: 200,
  SERVICE_UNAVAILABLE: 503,
  UNAUTHORIZED: 401,
  UNPROCESSABLE_ENTITY: 422,
} as const

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]

/**
 * Maps error categories to HTTP status codes
 */
export const ERROR_CATEGORY_TO_HTTP_STATUS = {
  [ERROR_CATEGORY.VALIDATION]: HTTP_STATUS.BAD_REQUEST,
  [ERROR_CATEGORY.AUTHENTICATION]: HTTP_STATUS.UNAUTHORIZED,
  [ERROR_CATEGORY.AUTHORIZATION]: HTTP_STATUS.FORBIDDEN,
  [ERROR_CATEGORY.NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
  [ERROR_CATEGORY.CONFLICT]: HTTP_STATUS.CONFLICT,
  [ERROR_CATEGORY.BUSINESS_RULE]: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  [ERROR_CATEGORY.EXTERNAL]: HTTP_STATUS.BAD_GATEWAY,
  [ERROR_CATEGORY.INTERNAL]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
} as const

/**
 * Get HTTP status code for an error category
 */
export function getHttpStatusForCategory({ category }: { category: string }): HttpStatus {
  return (
    ERROR_CATEGORY_TO_HTTP_STATUS[category as keyof typeof ERROR_CATEGORY_TO_HTTP_STATUS] ??
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  )
}
