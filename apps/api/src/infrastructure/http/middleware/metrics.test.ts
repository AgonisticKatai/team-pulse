import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import type { Container } from '../../config/container.js'
import { setupTestContainer } from '../../testing/test-containers.js'

describe('Metrics Middleware', () => {
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars-long'

    // Setup test container for database
    const container = await setupTestContainer()
    process.env.DATABASE_URL = container.container.getConnectionUri()
    cleanup = container.cleanup
  }, 120_000)

  afterAll(async () => {
    await cleanup()
  })

  it('should expose /metrics endpoint', async () => {
    const { app, container } = await buildApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('text/plain')
      expect(response.body).toBeDefined()
      expect(response.body.length).toBeGreaterThan(0)
    } finally {
      await app.close()
      await (container as Container).close()
    }
  })

  it('should track HTTP request duration', async () => {
    const { app, container } = await buildApp()

    try {
      // Make a request to generate metrics
      await app.inject({ method: 'GET', url: '/health' })

      // Get metrics
      const response = await app.inject({ method: 'GET', url: '/metrics' })

      expect(response.statusCode).toBe(200)
      // Should have duration histogram with proper structure
      expect(response.body).toContain('http_request_duration_seconds')
      expect(response.body).toContain('method=')
      expect(response.body).toContain('status_code=')
      // Should have recorded at least one request
      expect(response.body).toMatch(/http_request_duration_seconds_count\{[^}]*\}\s+[1-9]/)
    } finally {
      await app.close()
      await (container as Container).close()
    }
  })

  it('should increment request counter', async () => {
    const { app, container } = await buildApp()

    try {
      // Get baseline
      const before = await app.inject({ method: 'GET', url: '/metrics' })
      const beforeMatch = before.body.match(/http_requests_total\{[^}]*\}\s+(\d+)/)
      const beforeCount = beforeMatch?.[1] ? Number.parseInt(beforeMatch[1], 10) : 0

      // Make a request
      await app.inject({ method: 'GET', url: '/health' })

      // Check counter increased
      const after = await app.inject({ method: 'GET', url: '/metrics' })
      const afterMatch = after.body.match(/http_requests_total\{[^}]*\}\s+(\d+)/)
      const afterCount = afterMatch?.[1] ? Number.parseInt(afterMatch[1], 10) : 0

      expect(afterCount).toBeGreaterThan(beforeCount)
    } finally {
      await app.close()
      await (container as Container).close()
    }
  })

  it('should track metrics for failed requests', async () => {
    const { app, container } = await buildApp()

    try {
      // Make a failing request
      await app.inject({ method: 'GET', url: '/nonexistent' })

      // Check metrics recorded the 404
      const response = await app.inject({ method: 'GET', url: '/metrics' })

      expect(response.statusCode).toBe(200)
      expect(response.body).toContain('status_code="404"')
    } finally {
      await app.close()
      await (container as Container).close()
    }
  })

  it('should include default Node.js metrics', async () => {
    const { app, container } = await buildApp()

    try {
      const response = await app.inject({ method: 'GET', url: '/metrics' })

      expect(response.statusCode).toBe(200)
      // Check for prom-client default metrics
      expect(response.body).toContain('nodejs_')
      expect(response.body).toContain('process_')
    } finally {
      await app.close()
      await (container as Container).close()
    }
  })
})
