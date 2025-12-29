import type { IApplicationError } from '@team-pulse/shared'
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  InternalError,
  NotFoundError,
  ValidationError,
} from '@team-pulse/shared'

/**
 * HTTP Status to Error factory mapper
 *
 * Maps HTTP status codes to domain error constructors using dictionary pattern
 * Each factory includes the HTTP status in metadata for retry logic
 */
const STATUS_ERROR_MAP: Readonly<Record<number, (message: string, status: number) => IApplicationError>> = {
  400: (message, status) => ValidationError.create({ message, metadata: { status } }),
  401: (message, status) => AuthenticationError.create({ message, metadata: { status } }),
  403: (message, status) => AuthorizationError.create({ message, metadata: { status } }),
  404: (message, status) => NotFoundError.create({ message, metadata: { status } }),
  409: (message, status) => ConflictError.create({ message, metadata: { status } }),
  500: (message, status) => InternalError.create({ message, metadata: { status } }),
  502: (message, status) => InternalError.create({ message, metadata: { status } }),
  503: (message, status) => InternalError.create({ message, metadata: { status } }),
  504: (message, status) => InternalError.create({ message, metadata: { status } }),
}

/**
 * Map HTTP status code to domain error with status metadata
 */
export function mapStatusToError(params: { status: number; message: string }): IApplicationError {
  const { message, status } = params

  const errorFactory =
    STATUS_ERROR_MAP[status] ??
    ((msg: string, statusCode: number) =>
      InternalError.create({ message: `HTTP ${statusCode}: ${msg}`, metadata: { status: statusCode } }))

  return errorFactory(message, status)
}
