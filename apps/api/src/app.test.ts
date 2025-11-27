import type { Container } from '@infrastructure/config/container.js'
import { setupTestEnvironment } from '@infrastructure/testing/test-helpers.js'
import type { FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from './app.js'

describe('Fastify App', () => {
  let app: FastifyInstance
  let container: Container

  setupTestEnvironment()

  afterEach(async () => {
    if (app) {
      await app.close()
    }
    if (container) {
      await container.close()
    }
  })

  it('should create a Fastify instance', async () => {
    const result = await buildApp()
    app = result.app
    container = result.container

    expect(app).toBeDefined()
    expect(app.server).toBeDefined()
    expect(container).toBeDefined()
  })

  it('should respond to health check', async () => {
    const result = await buildApp()
    app = result.app
    container = result.container

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
    const result = await buildApp()
    app = result.app
    container = result.container

    const response = await app.inject({
      method: 'GET',
      url: '/api',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.name).toBe('TeamPulse API')
    expect(body.version).toBe('1.0.0')
    expect(body.endpoints.teams).toBe('/api/teams')
  })

  it('should return 404 for unknown routes', async () => {
    const result = await buildApp()
    app = result.app
    container = result.container

    const response = await app.inject({
      method: 'GET',
      url: '/api/unknown',
    })

    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})
