import type { TokenFactory } from '@application/factories/TokenFactory.js'
import type { CreateTeamUseCase } from '@application/use-cases/CreateTeamUseCase.js'
import type { DeleteTeamUseCase } from '@application/use-cases/DeleteTeamUseCase.js'
import type { GetTeamUseCase } from '@application/use-cases/GetTeamUseCase.js'
import type { ListTeamsUseCase } from '@application/use-cases/ListTeamsUseCase.js'
import type { UpdateTeamUseCase } from '@application/use-cases/UpdateTeamUseCase.js'
import { requireAuth, requireRole } from '@infrastructure/http/middleware/auth.js'
import { handleError } from '@infrastructure/http/middleware/error-handler.js'
import { TeamIdParamsSchema } from '@infrastructure/http/schemas/params.schemas.js'
import { FastifyLogger } from '@infrastructure/logging/FastifyLogger.js'
import { CreateTeamSchema, PaginationQuerySchema, UpdateTeamSchema, USER_ROLES } from '@team-pulse/shared'
import type { FastifyInstance } from 'fastify'

/**
 * Team Routes (HTTP ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Translates HTTP requests to use case calls
 * - Validates input using Zod schemas
 * - Maps errors to appropriate HTTP status codes
 * - Returns HTTP responses
 *
 * Responsibilities:
 * 1. Parse and validate HTTP request
 * 2. Call appropriate use case
 * 3. Handle errors and map to HTTP responses
 * 4. Return formatted HTTP response
 *
 * This layer knows about:
 * - Fastify
 * - HTTP status codes
 * - Request/Response formats
 *
 * This layer does NOT know about:
 * - Database implementation
 * - Business rules (delegated to use cases)
 */

interface TeamRouteDependencies {
  createTeamUseCase: CreateTeamUseCase
  getTeamUseCase: GetTeamUseCase
  listTeamsUseCase: ListTeamsUseCase
  updateTeamUseCase: UpdateTeamUseCase
  deleteTeamUseCase: DeleteTeamUseCase
  tokenFactory: TokenFactory
}

export function registerTeamRoutes(fastify: FastifyInstance, dependencies: TeamRouteDependencies) {
  const { createTeamUseCase, getTeamUseCase, listTeamsUseCase, updateTeamUseCase, deleteTeamUseCase, tokenFactory } =
    dependencies

  /**
   * POST /api/teams
   * Create a new team
   *
   * Requires: ADMIN or SUPER_ADMIN role
   */
  fastify.post(
    '/api/teams',
    { preHandler: [requireAuth({ tokenFactory }), requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])] },
    async (request, reply) => {
      try {
        // Validate request body using Zod
        const dto = CreateTeamSchema.parse(request.body)

        // Execute use case - Returns Result<TeamResponseDTO, ValidationError>
        const result = await createTeamUseCase.execute({ dto })

        // Handle use case error
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
        // Handle unexpected errors (Zod validation, etc.)
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    },
  )

  /**
   * GET /api/teams
   * List all teams with pagination
   *
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   *
   * Requires: Authentication (any role)
   */
  fastify.get('/api/teams', { preHandler: requireAuth({ tokenFactory }) }, async (request, reply) => {
    try {
      // Parse and validate pagination query params
      const { page, limit } = PaginationQuerySchema.parse(request.query)

      const result = await listTeamsUseCase.execute({ dto: { limit, page } })

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
  })

  /**
   * GET /api/teams/:id
   * Get a single team by ID
   *
   * Requires: Authentication (any role)
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: requireAuth({ tokenFactory }) },
    async (request, reply) => {
      try {
        // Validate and transform params: string → TeamId branded type
        const { id } = TeamIdParamsSchema.parse(request.params)

        const result = await getTeamUseCase.execute({ id })

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

  /**
   * PATCH /api/teams/:id
   * Update a team
   *
   * Requires: ADMIN or SUPER_ADMIN role
   */
  fastify.patch<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: [requireAuth({ tokenFactory }), requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])] },
    async (request, reply) => {
      try {
        // Validate and transform params: string → TeamId branded type
        const { id } = TeamIdParamsSchema.parse(request.params)

        // Validate request body
        const dto = UpdateTeamSchema.parse(request.body)

        // Execute use case - Returns Result<TeamResponseDTO, NotFoundError | ValidationError | RepositoryError>
        const result = await updateTeamUseCase.execute({ dto, id })

        // Handle use case error
        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        return reply.code(200).send({
          data: result.value,
          success: true,
        })
      } catch (error) {
        // Handle unexpected errors (Zod validation, etc.)
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    },
  )

  /**
   * DELETE /api/teams/:id
   * Delete a team
   *
   * Requires: ADMIN or SUPER_ADMIN role
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: [requireAuth({ tokenFactory }), requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])] },
    async (request, reply) => {
      try {
        // Validate and transform params: string → TeamId branded type
        const { id } = TeamIdParamsSchema.parse(request.params)

        await deleteTeamUseCase.execute({ id })

        return reply.code(204).send()
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    },
  )
}
