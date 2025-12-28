import { buildApp } from '@core/app/app.js'

// Build and start the app
const { app, container } = await buildApp()

// Get server configuration from validated env
const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Graceful shutdown handler
const closeGracefully = async (signal: string) => {
  app.log.info(`Received signal to terminate: ${signal}`)

  // Close server and cleanup resources
  await app.close()
  await container.close()

  process.exit(0)
}

// Register shutdown handlers
process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

// Start server
try {
  await app.listen({ host: HOST, port: PORT })
  app.log.info(`🚀 TeamPulse API running on http://${HOST}:${PORT}`)
  app.log.info(`📊 Health check: http://${HOST}:${PORT}/api/health`)
  app.log.info(`🏆 Teams API: http://${HOST}:${PORT}/api/teams`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
