import type { FastifyInstance } from 'fastify'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from './app'
import type { Container } from './infrastructure/config/container'

describe('Fastify App', () => {
  let app: FastifyInstance
  let container: Container

  // Set test environment variables
  beforeAll(() => {
    process.env.NODE_ENV = 'test'
    // Use PostgreSQL if DATABASE_URL is set (CI), otherwise SQLite in-memory (local)
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = ':memory:'
    }
  })

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
