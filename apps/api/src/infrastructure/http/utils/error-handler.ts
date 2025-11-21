import { DomainError } from '@domain/errors/DomainError.js'
import { DuplicatedError } from '@domain/errors/DuplicatedError.js'
import { NotFoundError } from '@domain/errors/NotFoundError.js'
import { ValidationError } from '@domain/errors/ValidationError.js'
import type { FastifyReply } from 'fastify'

/**
 * Centralized HTTP Error Handler
 *
 * Maps domain errors to appropriate HTTP responses
 * This is the ONLY place that knows about HTTP status codes for errors
 *
 * Error Mapping:
 * - ZodError -> 400 Bad Request
 * - ValidationError (credentials/refreshToken) -> 401 Unauthorized
 * - ValidationError (other) -> 400 Bad Request
 * - DuplicatedError -> 400 Bad Request
 * - NotFoundError (RefreshToken/User) -> 401 Unauthorized
 * - NotFoundError (other) -> 404 Not Found
 * - DomainError -> 400 Bad Request
 * - Unknown -> 500 Internal Server Error
 */
export function handleError({ error, reply }: { error: unknown; reply: FastifyReply }) {
  // Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        details: error,
        message: 'Invalid request data',
      },
      success: false,
    })
  }

  // Domain validation errors
  if (error instanceof ValidationError) {
    // Special handling for authentication errors
    if (error.field === 'credentials' || error.field === 'refreshToken') {
      return reply.code(401).send({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message,
        },
        success: false,
      })
    }

    return reply.code(400).send({
      error: {
        code: error.code,
        details: error.details,
        field: error.field,
        message: error.message,
      },
      success: false,
    })
  }

  // Duplicated entity errors
  if (error instanceof DuplicatedError) {
    return reply.code(400).send({
      error: {
        code: error.code,
        message: error.message,
      },
      success: false,
    })
  }

  // NotFound errors
  if (error instanceof NotFoundError) {
    // Refresh token or user not found during token refresh should return 401
    if (error.message.includes('RefreshToken') || error.message.includes('User')) {
      return reply.code(401).send({
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid or expired refresh token',
        },
        success: false,
      })
    }

    return reply.code(404).send({
      error: {
        code: error.code,
        message: error.message,
      },
      success: false,
    })
  }

  // Other domain errors
  if (error instanceof DomainError) {
    return reply.code(400).send({
      error: {
        code: error.code,
        message: error.message,
      },
      success: false,
    })
  }

  // Unknown errors
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    success: false,
  })
}
