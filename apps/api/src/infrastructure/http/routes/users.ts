import { CreateUserDTOSchema } from '@team-pulse/shared'
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { CreateUserUseCase } from '../../../application/use-cases/CreateUserUseCase.js'
import type { ListUsersUseCase } from '../../../application/use-cases/ListUsersUseCase.js'
import { DomainError, ValidationError } from '../../../domain/errors/index.js'
import type { Env } from '../../config/env.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

/**
 * User Management Routes (HTTP ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Translates HTTP requests to use case calls
 * - Validates input using Zod schemas
 * - Maps errors to appropriate HTTP status codes
 * - Returns HTTP responses
 *
 * Endpoints:
 * - POST /api/users - Create a new user (SUPER_ADMIN, ADMIN)
 * - GET /api/users - List all users (SUPER_ADMIN, ADMIN)
 *
 * All endpoints require authentication and specific roles.
 */

interface UserRouteDependencies {
  createUserUseCase: CreateUserUseCase
  listUsersUseCase: ListUsersUseCase
  env: Env
}

export async function registerUserRoutes(
  fastify: FastifyInstance,
  dependencies: UserRouteDependencies,
) {
  const { createUserUseCase, listUsersUseCase, env } = dependencies

  /**
   * POST /api/users
   * Create a new user
   *
   * Requires: SUPER_ADMIN or ADMIN role
   */
  fastify.post(
    '/api/users',
    { preHandler: [requireAuth(env), requireRole(['SUPER_ADMIN', 'ADMIN'])] },
    async (request, reply) => {
      try {
        // Validate request body using Zod
        const dto = CreateUserDTOSchema.parse(request.body)

        // Execute use case
        const user = await createUserUseCase.execute(dto)

        // Return success response
        return reply.code(201).send({
          data: user,
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * GET /api/users
   * List all users
   *
   * Requires: SUPER_ADMIN or ADMIN role
   */
  fastify.get(
    '/api/users',
    { preHandler: [requireAuth(env), requireRole(['SUPER_ADMIN', 'ADMIN'])] },
    async (_request, reply) => {
      try {
        const result = await listUsersUseCase.execute()

        return reply.code(200).send({
          data: result,
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )
}

/**
 * Error handler
 *
 * Maps domain errors to appropriate HTTP responses
 */
function handleError(error: unknown, reply: FastifyReply) {
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

  // Unknown errors (don't expose details)
  console.error('Unexpected error:', error)
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    success: false,
  })
}
