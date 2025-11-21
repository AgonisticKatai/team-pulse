import type { TokenFactory } from '@application/factories/TokenFactory.js'
import type { LoginUseCase } from '@application/use-cases/LoginUseCase.js'
import type { LogoutUseCase } from '@application/use-cases/LogoutUseCase.js'
import type { RefreshTokenUseCase } from '@application/use-cases/RefreshTokenUseCase.js'
import { requireAuth } from '@infrastructure/http/middleware/auth.js'
import { getMeSchema, loginSchema, logoutSchema, refreshTokenSchema } from '@infrastructure/http/schemas/auth.js'
import { handleError } from '@infrastructure/http/utils/error-handler.js'
import { LoginDTOSchema, RefreshTokenDTOSchema } from '@team-pulse/shared/dtos'
import type { FastifyInstance } from 'fastify'

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
  tokenFactory: TokenFactory
}

export function registerAuthRoutes(fastify: FastifyInstance, dependencies: AuthRouteDependencies) {
  const { loginUseCase, refreshTokenUseCase, logoutUseCase, tokenFactory } = dependencies

  /**
   * POST /api/auth/login
   * Login with email and password
   *
   * Rate limit: 5 attempts per 15 minutes to prevent brute force attacks
   */
  fastify.post(
    '/api/auth/login',
    {
      schema: loginSchema,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate request body using Zod
        const dto = LoginDTOSchema.parse(request.body)

        // Execute use case
        const result = await loginUseCase.execute(dto)

        // Handle Result type
        if (!result.ok) {
          return handleError({ error: result.error, reply })
        }

        // Return success response
        return reply.code(200).send({
          data: result.value,
          success: true,
        })
      } catch (error) {
        return handleError({ error, reply })
      }
    },
  )

  /**
   * POST /api/auth/refresh
   * Get new access token using refresh token
   */
  fastify.post('/api/auth/refresh', { schema: refreshTokenSchema }, async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenDTOSchema.parse(request.body)

      // Execute use case
      const result = await refreshTokenUseCase.execute(dto)

      // Handle Result type
      if (!result.ok) {
        return handleError({ error: result.error, reply })
      }

      // Return success response
      return reply.code(200).send({
        data: result.value,
        success: true,
      })
    } catch (error) {
      return handleError({ error, reply })
    }
  })

  /**
   * POST /api/auth/logout
   * Logout and invalidate refresh token
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.post('/api/auth/logout', { schema: logoutSchema, preHandler: requireAuth({ tokenFactory }) }, async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenDTOSchema.parse(request.body)

      // Execute use case (Result<void, never> - always succeeds)
      await logoutUseCase.execute(dto.refreshToken)

      // Return success response
      return reply.code(204).send()
    } catch (error) {
      return handleError({ error, reply })
    }
  })

  /**
   * GET /api/auth/me
   * Get current user information
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.get('/api/auth/me', { schema: getMeSchema, preHandler: requireAuth({ tokenFactory }) }, (request, reply) => {
    try {
      // User is available from requireAuth middleware
      const user = request.user

      return reply.code(200).send({
        data: user,
        success: true,
      })
    } catch (error) {
      return handleError({ error, reply })
    }
  })
}
