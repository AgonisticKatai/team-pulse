import { LoginDTOSchema, RefreshTokenDTOSchema } from '@team-pulse/shared'
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { LoginUseCase } from '../../../application/use-cases/LoginUseCase.js'
import type { LogoutUseCase } from '../../../application/use-cases/LogoutUseCase.js'
import type { RefreshTokenUseCase } from '../../../application/use-cases/RefreshTokenUseCase.js'
import { DomainError, ValidationError } from '../../../domain/errors/index.js'
import type { Env } from '../../config/env.js'
import { requireAuth } from '../middleware/auth.js'

/**
 * Authentication Routes (HTTP ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Translates HTTP requests to use case calls
 * - Validates input using Zod schemas
 * - Maps errors to appropriate HTTP status codes
 * - Returns HTTP responses
 *
 * Endpoints:
 * - POST /api/auth/login - Login with email and password
 * - POST /api/auth/refresh - Get new access token using refresh token
 * - POST /api/auth/logout - Logout and invalidate refresh token
 */

interface AuthRouteDependencies {
  loginUseCase: LoginUseCase
  refreshTokenUseCase: RefreshTokenUseCase
  logoutUseCase: LogoutUseCase
  env: Env
}

export async function registerAuthRoutes(
  fastify: FastifyInstance,
  dependencies: AuthRouteDependencies,
) {
  const { loginUseCase, refreshTokenUseCase, logoutUseCase, env } = dependencies

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = LoginDTOSchema.parse(request.body)

      // Execute use case
      const result = await loginUseCase.execute(dto)

      // Handle Result type
      if (!result.ok) {
        return handleError(result.error, reply)
      }

      // Return success response
      return reply.code(200).send({
        data: result.value,
        success: true,
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })

  /**
   * POST /api/auth/refresh
   * Get new access token using refresh token
   */
  fastify.post('/api/auth/refresh', async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenDTOSchema.parse(request.body)

      // Execute use case
      const result = await refreshTokenUseCase.execute(dto)

      // Handle Result type
      if (!result.ok) {
        return handleError(result.error, reply)
      }

      // Return success response
      return reply.code(200).send({
        data: result.value,
        success: true,
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })

  /**
   * POST /api/auth/logout
   * Logout and invalidate refresh token
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.post('/api/auth/logout', { preHandler: requireAuth(env) }, async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenDTOSchema.parse(request.body)

      // Execute use case (Result<void, never> - always succeeds)
      await logoutUseCase.execute(dto.refreshToken)

      // Return success response
      return reply.code(204).send()
    } catch (error) {
      return handleError(error, reply)
    }
  })

  /**
   * GET /api/auth/me
   * Get current user information
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.get('/api/auth/me', { preHandler: requireAuth(env) }, async (request, reply) => {
    try {
      // User is available from requireAuth middleware
      const user = request.user

      return reply.code(200).send({
        data: user,
        success: true,
      })
    } catch (error) {
      return handleError(error, reply)
    }
  })
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
