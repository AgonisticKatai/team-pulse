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

/**
 * Reconstruct the original API path for Fastify routing
 *
 * With Vercel routes configuration, the URL is preserved in req.url.
 * If it starts with /api/index.ts, we need to extract the original path.
 * Otherwise, the URL should already be correct.
 *
 * @param url - The request URL
 * @returns The reconstructed API path
 */
function reconstructApiPath(url: string): string {
  // If URL was rewritten to /api/index.ts, extract original path
  if (url.startsWith('/api/index.ts')) {
    // The original path should be after /api/index.ts
    const afterFunction = url.substring('/api/index.ts'.length)
    return afterFunction || '/api'
  }

  // URL should already be correct (e.g., /api/auth/login)
  return url
}

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp()
    await app.ready()

    // Debug logging
    console.log('[Vercel Handler] Original URL:', req.url)
    console.log('[Vercel Handler] Method:', req.method)

    // Reconstruct the original URL path for Fastify routing
    // With routes configuration, Vercel preserves the URL
    const originalUrl = typeof req.url === 'string' ? req.url : '/'
    req.url = reconstructApiPath(originalUrl)

    console.log('[Vercel Handler] Final URL for Fastify:', req.url)

    // Forward the request to Fastify
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
