import cors from '@fastify/cors'
import { config } from 'dotenv'
import Fastify from 'fastify'

// Load environment variables
config()

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
})

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Register CORS
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
})

// Health check endpoint
fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    message: 'TeamPulse API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }
})

// Root endpoint
fastify.get('/api', async () => {
  return {
    name: 'TeamPulse API',
    version: '1.0.0',
    description: 'Football team statistics platform API',
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

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST })
  console.log(`🚀 TeamPulse API running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
