import cors from '@fastify/cors'
import Fastify, {
  type FastifyRequest,
  type FastifyReply,
  type FastifyInstance,
  type FastifyError,
} from 'fastify'
import { type Container, createContainer } from './infrastructure/config/container.js'
import { type Env, validateEnv, validateProductionEnv } from './infrastructure/config/env.js'
import { registerTeamRoutes } from './infrastructure/http/routes/teams.js'

/**
 * Build and configure the Fastify application
 *
 * This is the main entry point for assembling the application:
 * 1. Validate environment configuration
 * 2. Create dependency injection container
 * 3. Configure Fastify plugins
 * 4. Register routes (HTTP adapters)
 * 5. Setup error handlers
 *
 * The application follows Hexagonal Architecture:
 * - Domain: Business logic (entities, repository interfaces)
 * - Application: Use cases, orchestration
 * - Infrastructure: Adapters (HTTP, Database, etc.)
 */

export async function buildApp(): Promise<{ app: FastifyInstance; container: Container }> {
  // 1. Validate environment variables (fail-fast if invalid)
  const env: Env = validateEnv()
  validateProductionEnv(env)

  // 2. Create dependency injection container
  const container = await createContainer(env)

  // 3. Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  })

  // 4. Register CORS plugin
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
  })

  // 5. Register routes (HTTP adapters)
  await registerTeamRoutes(fastify, {
    createTeamUseCase: container.createTeamUseCase,
    getTeamUseCase: container.getTeamUseCase,
    listTeamsUseCase: container.listTeamsUseCase,
    updateTeamUseCase: container.updateTeamUseCase,
    deleteTeamUseCase: container.deleteTeamUseCase,
  })

  // 6. Health check endpoint
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      message: 'TeamPulse API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: '1.0.0',
    }
  })

  // 7. API info endpoint
  fastify.get('/api', async () => {
    return {
      name: 'TeamPulse API',
      version: '1.0.0',
      description: 'Football team statistics platform API',
      endpoints: {
        health: '/api/health',
        teams: '/api/teams',
      },
    }
  })

  // 8. 404 handler
  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.url} not found`,
      },
    })
  })

  // 9. Global error handler
  fastify.setErrorHandler(
    async (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error(error)

      const statusCode = error.statusCode || 500

      return reply.code(statusCode).send({
        success: false,
        error: {
          code: error.name || 'INTERNAL_SERVER_ERROR',
          message: env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
        },
      })
    },
  )

  await fastify.ready()

  return { app: fastify, container }
}
