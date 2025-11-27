import compress from '@fastify/compress'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { type Container, createContainer } from '@infrastructure/config/container.js'
import { type Env, validateEnv, validateProductionEnv } from '@infrastructure/config/env.js'
import { correlationIdMiddleware } from '@infrastructure/http/middleware/correlation-id.js'
import { handleError } from '@infrastructure/http/middleware/error-handler.js'
import { createMetricsOnRequest, createMetricsOnResponse } from '@infrastructure/http/middleware/metrics.js'
import { registerAuthRoutes } from '@infrastructure/http/routes/auth.js'
import { registerTeamRoutes } from '@infrastructure/http/routes/teams.js'
import { registerUserRoutes } from '@infrastructure/http/routes/users.js'
import { FastifyLogger } from '@infrastructure/logging/FastifyLogger.js'
import { createLoggerConfig } from '@infrastructure/logging/logger-config.js'
import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Build and configure the Fastify application
 *
 * This is the main entry point for assembling the application:
 * 1. Validate environment configuration
 * 2. Create dependency injection container
 * 3. Configure Fastify with structured logging
 * 4. Add correlation ID middleware
 * 5. Configure security headers (Helmet)
 * 6. Configure metrics hooks (Prometheus)
 * 7. Configure HTTP compression
 * 8. Configure CORS
 * 9. Configure rate limiting
 * 10. Register routes (HTTP adapters)
 * 11. Setup health check endpoint
 * 12. Setup API info endpoint
 * 13. Setup 404 handler
 * 14. Setup global error handler
 *
 * Note: Database migrations are NOT run here. They should be executed separately:
 * - Development: npm run db:migrate:run
 * - Production: npm run db:migrate:ci (in CI/CD before deployment)
 * - Tests: Test containers use db:push automatically
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

  // 6. Register Security Headers (Helmet)
  // Adds security headers to protect against common vulnerabilities:
  // - XSS (Cross-Site Scripting)
  // - Clickjacking
  // - MIME sniffing
  // - Content Security Policy
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })

  // 7. Register Metrics hooks (for Prometheus)
  // Uses onRequest to capture start time and onResponse to record metrics
  // This is the recommended Fastify pattern for metrics collection
  // onResponse hook fires after response is sent, ideal for statistics
  fastify.addHook('onRequest', createMetricsOnRequest())
  fastify.addHook('onResponse', createMetricsOnResponse({ metricsService: container.metricsService }))

  // 8. Register HTTP Compression
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

  // 9. Register CORS plugin
  await fastify.register(cors, {
    credentials: true,
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : 'http://localhost:5173',
  })

  // 10. Register Rate Limiting
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

  // 11. Register routes (HTTP adapters)

  // Metrics endpoint (Prometheus format)
  fastify.get('/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await container.metricsService.getMetrics()
    reply.header('Content-Type', container.metricsService.getContentType())
    return reply.send(metrics)
  })

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

  // 11. Health check endpoint
  fastify.get('/api/health', () => {
    return {
      environment: env.NODE_ENV,
      message: 'TeamPulse API is running',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }
  })

  // 12. API info endpoint
  fastify.get('/api', () => {
    return {
      description: 'Football team statistics platform API',
      endpoints: {
        auth: '/api/auth/*',
        health: '/api/health',
        metrics: '/metrics',
        teams: '/api/teams',
        users: '/api/users',
      },
      name: 'TeamPulse API',
      version: '1.0.0',
    }
  })

  // 13. 404 handler
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.url} not found`,
      },
      success: false,
    })
  })

  // 14. Global error handler
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const logger = FastifyLogger.create({ logger: request.log })
    return handleError({ error, reply, logger })
  })

  await fastify.ready()

  return { app: fastify, container }
}
