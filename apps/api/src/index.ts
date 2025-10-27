import { config } from 'dotenv'
import { buildApp } from './app.js'

// Load environment variables
config()

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Build and start the app
const fastify = await buildApp()

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  fastify.log.info(`Received signal to terminate: ${signal}`)
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST })
  fastify.log.info(`🚀 TeamPulse API running on http://${HOST}:${PORT}`)
  fastify.log.info(`📊 Health check: http://${HOST}:${PORT}/api/health`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
