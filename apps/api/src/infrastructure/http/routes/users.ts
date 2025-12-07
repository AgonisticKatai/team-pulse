import type { TokenFactory } from '@application/factories/TokenFactory.js'
import type { CreateUserUseCase } from '@application/use-cases/CreateUserUseCase.js'
import type { ListUsersUseCase } from '@application/use-cases/ListUsersUseCase.js'
import { requireAuth, requireRole } from '@infrastructure/http/middleware/auth.js'
import { handleError } from '@infrastructure/http/middleware/error-handler.js'
import { FastifyLogger } from '@infrastructure/logging/FastifyLogger.js'
import { CreateUserDTOSchema, PaginationQuerySchema } from '@team-pulse/shared/dtos'
import type { FastifyInstance } from 'fastify'

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
  tokenFactory: TokenFactory
}

export function registerUserRoutes(fastify: FastifyInstance, dependencies: UserRouteDependencies) {
  const { createUserUseCase, listUsersUseCase, tokenFactory } = dependencies

  /**
   * POST /api/users
   * Create a new user
   *
   * Requires: SUPER_ADMIN or ADMIN role
   */
  fastify.post(
    '/api/users',
    { preHandler: [requireAuth({ tokenFactory }), requireRole(['SUPER_ADMIN', 'ADMIN'])] },
    async (request, reply) => {
      try {
        // Validate request body using Zod
        const dto = CreateUserDTOSchema.parse(request.body)

        // Execute use case
        const result = await createUserUseCase.execute({ dto })

        // Handle Result type
        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        // Return success response
        return reply.code(201).send({
          data: result.value,
          success: true,
        })
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    },
  )

  /**
   * GET /api/users
   * List all users with pagination
   *
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   *
   * Requires: SUPER_ADMIN or ADMIN role
   */
  fastify.get(
    '/api/users',
    { preHandler: [requireAuth({ tokenFactory }), requireRole(['SUPER_ADMIN', 'ADMIN'])] },
    async (request, reply) => {
      try {
        // Parse and validate pagination query params
        const { page, limit } = PaginationQuerySchema.parse(request.query)

        const result = await listUsersUseCase.execute({ dto: { limit, page } })

        // Handle Result type
        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        return reply.code(200).send({
          data: result.value,
          success: true,
        })
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    },
  )
}
