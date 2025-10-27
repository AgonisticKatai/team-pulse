import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from './app'

describe('Fastify App', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('should create a Fastify instance', async () => {
    app = await buildApp()
    expect(app).toBeDefined()
    expect(app.server).toBeDefined()
  })

  it('should respond to health check', async () => {
    app = await buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
    expect(body.message).toBe('TeamPulse API is running')
    expect(body.timestamp).toBeDefined()
  })

  it('should respond to root endpoint', async () => {
    app = await buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.name).toBe('TeamPulse API')
    expect(body.version).toBe('1.0.0')
  })

  it('should return 404 for unknown routes', async () => {
    app = await buildApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/unknown',
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Not Found')
  })
})
