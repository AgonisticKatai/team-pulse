import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildApp } from '../apps/api/src/app.js'

// Cache the Fastify app instance (singleton pattern for serverless)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedApp: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let appPromise: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getApp(): Promise<any> {
  // Return cached instance if available
  if (cachedApp) {
    return cachedApp
  }

  // Reuse ongoing initialization if available
  if (appPromise) {
    return appPromise
  }

  // Initialize app
  appPromise = buildApp()
    .then(({ app }) => {
      cachedApp = app
      appPromise = null
      return app
    })
    .catch((error) => {
      appPromise = null
      throw error
    })

  return appPromise
}

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp()
    await app.ready()

    // Forward the request directly to Fastify
    // Vercel rewrites preserve the original URL path
    app.server.emit('request', req, res)
  } catch (error) {
    console.error('Serverless function error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initialize API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    })
  }
}
