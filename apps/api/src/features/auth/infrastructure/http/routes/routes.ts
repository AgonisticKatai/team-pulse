import type { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import type { LoginUseCase } from '@features/auth/application/use-cases/login/LoginUseCase.js'
import type { LogoutUseCase } from '@features/auth/application/use-cases/logout/LogoutUseCase.js'
import type { RefreshTokenUseCase } from '@features/auth/application/use-cases/refresh-token/RefreshTokenUseCase.js'
import { requireAuth } from '@shared/http/middleware/auth.js'
import { handleError } from '@shared/http/middleware/error-handler.js'
import { FastifyLogger } from '@shared/logging/fastify/FastifyLogger.js'
import { LoginSchema, RefreshTokenSchema } from '@team-pulse/shared'
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
        const dto = LoginSchema.parse(request.body)

        // Execute use case
        const result = await loginUseCase.execute({ dto })

        // Handle Result type
        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        // Return success response
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
   * POST /api/auth/refresh
   * Get new access token using refresh token
   */
  fastify.post('/api/auth/refresh', async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenSchema.parse(request.body)

      // Execute use case
      const result = await refreshTokenUseCase.execute({ dto })

      // Handle Result type
      if (!result.ok) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error: result.error, logger, reply })
      }

      // Return success response
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
   * POST /api/auth/logout
   * Logout and invalidate refresh token
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.post('/api/auth/logout', { preHandler: requireAuth({ tokenFactory }) }, async (request, reply) => {
    try {
      // Validate request body using Zod
      const dto = RefreshTokenSchema.parse(request.body)

      // Execute use case (Result<void, never> - always succeeds)
      await logoutUseCase.execute({ refreshToken: dto.refreshToken })

      // Return success response
      return reply.code(204).send()
    } catch (error) {
      const logger = FastifyLogger.create({ logger: request.log })
      return handleError({ error, logger, reply })
    }
  })

  /**
   * GET /api/auth/me
   * Get current user information
   *
   * Requires authentication (access token in Authorization header)
   */
  fastify.get('/api/auth/me', { preHandler: requireAuth({ tokenFactory }) }, (request, reply) => {
    try {
      // User is guaranteed by requireAuth middleware
      // biome-ignore lint/style/noNonNullAssertion: requireAuth middleware ensures user is defined
      const { email, role, userId } = request.user!

      return reply.code(200).send({
        data: {
          email,
          role, // Already a string from JWT payload
          userId,
        },
        success: true,
      })
    } catch (error) {
      const logger = FastifyLogger.create({ logger: request.log })
      return handleError({ error, logger, reply })
    }
  })
}
