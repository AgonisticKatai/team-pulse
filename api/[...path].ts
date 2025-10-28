import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buildApp } from '../apps/api/src/app.js'

// Build the Fastify app
const { app } = await buildApp()

// Export the handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await app.ready()
  app.server.emit('request', req, res)
}
