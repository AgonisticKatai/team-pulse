import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query

  // Health check
  if (!path || path[0] === 'health') {
    return res.status(200).json({
      status: 'ok',
      message: 'TeamPulse API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
    })
  }

  // Root endpoint
  if (path[0] === '') {
    return res.status(200).json({
      name: 'TeamPulse API',
      version: '1.0.0',
      description: 'Football team statistics platform API',
    })
  }

  // 404 for unknown routes
  return res.status(404).json({
    error: 'Not Found',
    message: `Route /api/${Array.isArray(path) ? path.join('/') : path} not found`,
    statusCode: 404,
  })
}
