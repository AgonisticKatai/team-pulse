import compress from '@fastify/compress'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { type Container, createContainer } from './infrastructure/config/container.js'
import { type Env, validateEnv, validateProductionEnv } from './infrastructure/config/env.js'
import { runMigrations } from './infrastructure/database/migrate.js'
import { correlationIdMiddleware } from './infrastructure/http/middleware/correlation-id.js'
import { registerAuthRoutes } from './infrastructure/http/routes/auth.js'
import { registerTeamRoutes } from './infrastructure/http/routes/teams.js'
import { registerUserRoutes } from './infrastructure/http/routes/users.js'
import { createLoggerConfig } from './infrastructure/logging/logger-config.js'

/**
 * Build and configure the Fastify application
 *
 * This is the main entry point for assembling the application:
 * 1. Validate environment configuration
 * 2. Run database migrations
 * 3. Create dependency injection container
 * 4. Configure Fastify with structured logging
 * 5. Add correlation ID middleware
 * 6. Configure HTTP compression
 * 7. Configure CORS
 * 8. Configure rate limiting
 * 9. Register routes (HTTP adapters)
 * 10. Setup health check endpoint
 * 11. Setup API info endpoint
 * 12. Setup 404 handler
 * 13. Setup global error handler
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

  // 2. Run database migrations (ensures database schema is up-to-date)
  await runMigrations(env.DATABASE_URL)

  // 3. Create dependency injection container
  const container = createContainer(env)

  // 4. Create Fastify instance with structured logging
  const fastify = Fastify({
    logger: createLoggerConfig(env.NODE_ENV, env.LOG_LEVEL),
    // Generate unique request IDs
    genReqId: () => crypto.randomUUID(),
  })

  // 5. Register Correlation ID middleware (for distributed tracing)
  //
  // This middleware:
  // - Extracts or generates a correlation ID for each request
  // - Attaches it to request.correlationId
  // - Adds X-Correlation-ID response header
  // - Available in logs via request serializer
  //
  // CRITICAL: This middleware MUST be tested in all environments including test.
  // We had production issues with timeouts when this was sync instead of async.
  // Testing it ensures we catch similar issues before they reach production.
  //
  // The middleware is async for proper Fastify lifecycle handling with pino-pretty.
  fastify.addHook('onRequest', correlationIdMiddleware)

  // 6. Register HTTP Compression
  // Compresses responses using gzip, deflate, or brotli based on Accept-Encoding header
  // Only compresses responses larger than 1KB for efficiency
  // Brotli provides best compression but more CPU intensive
  // Gzip is widely supported and good balance
  await fastify.register(compress, {
    global: true,
    threshold: 1024, // Only compress responses > 1KB
    encodings: ['br', 'gzip', 'deflate'], // Priority order: brotli > gzip > deflate
    // Don't compress already compressed formats
    removeContentLengthHeader: true,
  })

  // 7. Register CORS plugin
  await fastify.register(cors, {
    credentials: true,
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : 'http://localhost:5173',
  })

  // 8. Register Rate Limiting
  // Global rate limit: 100 requests per 15 minutes per IP
  // Protects against DDoS and brute force attacks
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    errorResponseBuilder: () => ({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      },
      success: false,
    }),
  })

  // 9. Register routes (HTTP adapters)

  // Authentication routes
  await registerAuthRoutes(fastify, {
    loginUseCase: container.loginUseCase,
    logoutUseCase: container.logoutUseCase,
    refreshTokenUseCase: container.refreshTokenUseCase,
    tokenFactory: container.tokenFactory,
  })

  // User management routes
  await registerUserRoutes(fastify, {
    createUserUseCase: container.createUserUseCase,
    listUsersUseCase: container.listUsersUseCase,
    tokenFactory: container.tokenFactory,
  })

  // Team routes
  await registerTeamRoutes(fastify, {
    createTeamUseCase: container.createTeamUseCase,
    deleteTeamUseCase: container.deleteTeamUseCase,
    getTeamUseCase: container.getTeamUseCase,
    listTeamsUseCase: container.listTeamsUseCase,
    tokenFactory: container.tokenFactory,
    updateTeamUseCase: container.updateTeamUseCase,
  })

  // 9. Health check endpoint
  fastify.get('/api/health', () => {
    return {
      environment: env.NODE_ENV,
      message: 'TeamPulse API is running',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  })

  // 10. API info endpoint
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

  // 11. 404 handler
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.url} not found`,
      },
      success: false,
    })
  })

  // 12. Global error handler
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
