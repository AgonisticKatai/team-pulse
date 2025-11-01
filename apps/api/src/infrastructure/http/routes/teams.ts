import { CreateTeamDTOSchema, UpdateTeamDTOSchema } from '@team-pulse/shared'
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { CreateTeamUseCase } from '../../../application/use-cases/CreateTeamUseCase.js'
import type { DeleteTeamUseCase } from '../../../application/use-cases/DeleteTeamUseCase.js'
import type { GetTeamUseCase } from '../../../application/use-cases/GetTeamUseCase.js'
import type { ListTeamsUseCase } from '../../../application/use-cases/ListTeamsUseCase.js'
import type { UpdateTeamUseCase } from '../../../application/use-cases/UpdateTeamUseCase.js'
import { DomainError, NotFoundError, ValidationError } from '../../../domain/errors/index.js'
import type { Env } from '../../config/env.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

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
  env: Env
}

export async function registerTeamRoutes(
  fastify: FastifyInstance,
  dependencies: TeamRouteDependencies,
) {
  const {
    createTeamUseCase,
    getTeamUseCase,
    listTeamsUseCase,
    updateTeamUseCase,
    deleteTeamUseCase,
    env,
  } = dependencies

  /**
   * POST /api/teams
   * Create a new team
   *
   * Requires: ADMIN or SUPER_ADMIN role
   */
  fastify.post(
    '/api/teams',
    { preHandler: [requireAuth(env), requireRole(['ADMIN', 'SUPER_ADMIN'])] },
    async (request, reply) => {
      try {
        // Validate request body using Zod
        const dto = CreateTeamDTOSchema.parse(request.body)

        // Execute use case
        const team = await createTeamUseCase.execute(dto)

        // Return success response
        return reply.code(201).send({
          data: team,
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * GET /api/teams
   * List all teams
   *
   * Requires: Authentication (any role)
   */
  fastify.get('/api/teams', { preHandler: requireAuth(env) }, async (_request, reply) => {
    try {
      const result = await listTeamsUseCase.execute()

      return reply.code(200).send({
        data: result,
        success: true,
      })
    } catch (error) {
      return handleError(error, reply)
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
    { preHandler: requireAuth(env) },
    async (request, reply) => {
      try {
        const { id } = request.params

        const team = await getTeamUseCase.execute(id)

        return reply.code(200).send({
          data: team,
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
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
    { preHandler: [requireAuth(env), requireRole(['ADMIN', 'SUPER_ADMIN'])] },
    async (request, reply) => {
      try {
        const { id } = request.params

        // Validate request body
        const dto = UpdateTeamDTOSchema.parse(request.body)

        // Execute use case
        const team = await updateTeamUseCase.execute(id, dto)

        return reply.code(200).send({
          data: team,
          success: true,
        })
      } catch (error) {
        return handleError(error, reply)
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
    { preHandler: [requireAuth(env), requireRole(['ADMIN', 'SUPER_ADMIN'])] },
    async (request, reply) => {
      try {
        const { id } = request.params

        await deleteTeamUseCase.execute(id)

        return reply.code(204).send()
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
 * This is the ONLY place that knows about HTTP status codes for errors
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

  // Not found errors
  if (error instanceof NotFoundError) {
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
