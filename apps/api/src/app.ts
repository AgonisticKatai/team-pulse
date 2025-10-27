import cors from '@fastify/cors'
import Fastify, {
  type FastifyRequest,
  type FastifyReply,
  type FastifyInstance,
  type FastifyError,
} from 'fastify'

export async function buildApp(): Promise<FastifyInstance> {
  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL must be defined in production')
  }

  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  // Register CORS first
  await fastify.register(cors, {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
  })

  // Now register routes (after await)
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      message: 'TeamPulse API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    }
  })

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

  fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.url} not found`,
      statusCode: 404,
    })
  })

  fastify.setErrorHandler(
    async (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      fastify.log.error(error)

      const statusCode = error.statusCode || 500

      return reply.code(statusCode).send({
        error: error.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
        statusCode,
      })
    },
  )

  await fastify.ready()
  return fastify
}
