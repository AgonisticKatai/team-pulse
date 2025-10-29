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
 * Reconstruct the original API path from Vercel catch-all route parameters
 *
 * With [...path].ts, Vercel captures route segments and passes them in req.query.path
 * as string | string[] | undefined. This function reconstructs the original URL path
 * that Fastify expects for routing.
 *
 * This is the standard pattern for Vercel catch-all routes - see official docs:
 * https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#dynamic-routing
 *
 * @example
 * // Request: /api/auth/login
 * // req.query.path = ['auth', 'login']
 * // Result: '/api/auth/login'
 *
 * @param path - The path parameter(s) from Vercel's catch-all route
 * @returns The reconstructed API path with /api prefix
 */
function reconstructApiPath(path: string | string[] | undefined): string {
  if (!path) {
    return '/api'
  }

  // Normalize path to array of segments
  const segments = Array.isArray(path) ? path : [path]

  // Reconstruct full API path
  return `/api/${segments.join('/')}`
}

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp()
    await app.ready()

    // Reconstruct the original URL path for Fastify routing
    // This is the standard pattern for Vercel catch-all routes with [...path].ts
    req.url = reconstructApiPath(req.query.path)

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
