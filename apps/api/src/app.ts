import Fastify from 'fastify'
import cors from '@fastify/cors'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  // Register CORS
  await fastify.register(cors, {
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || true
        : 'http://localhost:5173',
    credentials: true,
  })

  // Health check endpoint
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      message: 'TeamPulse API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    }
  })

  // Root endpoint
  fastify.get('/api', async () => {
    return {
      name: 'TeamPulse API',
      version: '1.0.0',
      description: 'Football team statistics platform API',
      endpoints: {
        health: '/api/health',
      },
    }
  })

  // 404 handler
  fastify.setNotFoundHandler(async (request) => {
    return {
      error: 'Not Found',
      message: `Route ${request.url} not found`,
      statusCode: 404,
    }
  })

  // Error handler
  fastify.setErrorHandler(async (error, _request, reply) => {
    fastify.log.error(error)

    return reply.status(error.statusCode || 500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      statusCode: error.statusCode || 500,
    })
  })

  return fastify
}
