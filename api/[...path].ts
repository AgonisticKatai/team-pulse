import { buildApp } from '../apps/api/src/app.js'

// Build the Fastify app
const app = await buildApp()

// Export the handler for Vercel
export default async function handler(req: any, res: any) {
  await app.ready()
  app.server.emit('request', req, res)
}
