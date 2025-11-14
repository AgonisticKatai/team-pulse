import cors from '@fastify/cors'
import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { type Container, createContainer } from './infrastructure/config/container.js'
import { type Env, validateEnv, validateProductionEnv } from './infrastructure/config/env.js'
import { registerAuthRoutes } from './infrastructure/http/routes/auth.js'
import { registerTeamRoutes } from './infrastructure/http/routes/teams.js'
import { registerUserRoutes } from './infrastructure/http/routes/users.js'

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
  const container = createContainer(env)

  // 3. Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  })

  // 4. Register CORS plugin
  await fastify.register(cors, {
    credentials: true,
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : 'http://localhost:5173',
  })

  // 5. Register routes (HTTP adapters)

  // Authentication routes
  await registerAuthRoutes(fastify, {
    env,
    loginUseCase: container.loginUseCase,
    logoutUseCase: container.logoutUseCase,
    refreshTokenUseCase: container.refreshTokenUseCase,
  })

  // User management routes
  await registerUserRoutes(fastify, {
    createUserUseCase: container.createUserUseCase,
    env,
    listUsersUseCase: container.listUsersUseCase,
  })

  // Team routes
  await registerTeamRoutes(fastify, {
    createTeamUseCase: container.createTeamUseCase,
    deleteTeamUseCase: container.deleteTeamUseCase,
    env,
    getTeamUseCase: container.getTeamUseCase,
    listTeamsUseCase: container.listTeamsUseCase,
    updateTeamUseCase: container.updateTeamUseCase,
  })

  // 6. Health check endpoint
  fastify.get('/api/health', () => {
    return {
      environment: env.NODE_ENV,
      message: 'TeamPulse API is running',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  })

  // 7. API info endpoint
  fastify.get('/api', () => {
    return {
      description: 'Football team statistics platform API',
      endpoints: {
        auth: '/api/auth/*',
        health: '/api/health',
        teams: '/api/teams',
        users: '/api/users',
      },
      name: 'TeamPulse API',
      version: '1.0.0',
    }
  })

  // 8. 404 handler
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.url} not found`,
      },
      success: false,
    })
  })

  // 9. Global error handler
  fastify.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error)

    const statusCode = error.statusCode || 500

    return reply.code(statusCode).send({
      error: {
        code: error.name || 'INTERNAL_SERVER_ERROR',
        message: env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      },
      success: false,
    })
  })

  await fastify.ready()

  return { app: fastify, container }
}
