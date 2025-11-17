import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import { setupTestContainer } from '../../../infrastructure/testing/test-containers.js'

/**
 * Integration tests for correlation ID middleware
 *
 * CRITICAL: These tests validate that the middleware doesn't cause timeouts or deadlocks.
 * We had a production incident where a synchronous middleware caused the entire API to hang.
 * These tests ensure we catch such issues in CI before they reach production.
 *
 * What we're testing:
 * 1. The middleware is registered and active (even in test environment)
 * 2. Requests complete without timeouts (validates async hook works correctly)
 * 3. Correlation IDs are properly set in response headers
 * 4. Client-provided correlation IDs are preserved
 * 5. Multiple concurrent requests work without deadlocks
 *
 * These tests run with a REAL Fastify instance with ALL middleware enabled,
 * which is critical to catch integration issues.
 */
describe('Correlation ID Middleware - Critical Integration Tests', () => {
  let app: FastifyInstance
  let cleanup: () => Promise<void>

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars-long'

    // Setup isolated PostgreSQL container for this test suite
    const result = await setupTestContainer()
    cleanup = result.cleanup

    // Set DATABASE_URL to use the test container
    process.env.DATABASE_URL = result.container.getConnectionUri()
  }, 120_000) // 2 minute timeout for container startup

  beforeEach(async () => {
    // Build app with test container database and ALL middleware enabled
    const result = await buildApp()
    app = result.app
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should not cause timeouts - validates async hook implementation', async () => {
    // This test is CRITICAL. If the middleware is sync instead of async,
    // this will timeout and fail, preventing deployment of broken code.
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out - middleware may be blocking')), 2000)
    })

    const requestPromise = app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'any',
      },
    })

    // If this fails, the middleware is blocking the request lifecycle
    const response = await Promise.race([requestPromise, timeoutPromise])

    // Don't care about status (will be 401), just that it completed without timeout
    expect(response.statusCode).toBeGreaterThan(0)
  })

  it('should generate correlation ID when not provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'any',
      },
    })

    expect(response.headers['x-correlation-id']).toBeDefined()
    expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('should preserve client-provided correlation ID', async () => {
    const correlationId = randomUUID()

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        'x-correlation-id': correlationId,
      },
      payload: {
        email: 'test@example.com',
        password: 'any',
      },
    })

    expect(response.headers['x-correlation-id']).toBe(correlationId)
  })

  it('should handle array correlation ID headers correctly', async () => {
    const correlationId = randomUUID()
    const secondId = randomUUID()

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        'x-correlation-id': [correlationId, secondId],
      },
      payload: {
        email: 'test@example.com',
        password: 'any',
      },
    })

    // Fastify may return both IDs separated by comma, or just the first one
    // Our middleware uses the first one from the array
    const returnedId = response.headers['x-correlation-id']
    expect(returnedId).toBeDefined()
    expect(typeof returnedId).toBe('string')
    // Should include the first correlation ID (may have others comma-separated)
    expect(returnedId).toContain(correlationId)
  })

  it('should handle multiple concurrent requests without deadlocks', async () => {
    // This test validates that the middleware doesn't cause race conditions
    // or deadlocks when processing multiple requests simultaneously
    const requests = Array.from({ length: 10 }, (_, i) =>
      app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: i % 2 === 0 ? { 'x-correlation-id': randomUUID() } : {},
        payload: {
          email: 'test@example.com',
          password: 'any',
        },
      }),
    )

    const responses = await Promise.all(requests)

    // All requests should succeed (or fail with 401, but complete without timeout)
    for (const response of responses) {
      expect(response.statusCode).toBeGreaterThan(0)
      expect(response.headers['x-correlation-id']).toBeDefined()
    }

    // All correlation IDs should be unique (for requests without provided IDs)
    const correlationIds = responses.map((r) => r.headers['x-correlation-id'])
    const withoutProvidedIds = correlationIds.filter((_, i) => i % 2 !== 0)
    const uniqueIds = new Set(withoutProvidedIds)
    expect(uniqueIds.size).toBe(withoutProvidedIds.length)
  })

  it('should work correctly with protected endpoints', async () => {
    // Validates that middleware works with auth middleware
    const correlationId = randomUUID()

    const response = await app.inject({
      method: 'GET',
      url: '/api/teams', // Protected endpoint that requires auth
      headers: {
        'x-correlation-id': correlationId,
      },
    })

    // Should fail auth (401) but correlation ID should still be present
    expect(response.statusCode).toBe(401)
    expect(response.headers['x-correlation-id']).toBe(correlationId)
  })

  it('should work correctly with POST requests', async () => {
    const correlationId = randomUUID()

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      headers: {
        'x-correlation-id': correlationId,
      },
      payload: {
        email: 'test@example.com',
        password: 'wrong-password',
      },
    })

    // Should fail (401) but correlation ID should be present
    expect(response.statusCode).toBe(401)
    expect(response.headers['x-correlation-id']).toBe(correlationId)
  })
})

/**
 * Why these tests are essential:
 *
 * 1. Production Safety: We had a critical incident where a sync middleware caused
 *    the entire API to hang. These tests catch that before deployment.
 *
 * 2. CI/CD Validation: These tests run on every commit, ensuring any changes to
 *    the middleware or Fastify configuration don't break request handling.
 *
 * 3. Real Environment: Tests run with the REAL app configuration, not mocks,
 *    so they validate actual behavior.
 *
 * 4. Regression Prevention: If someone accidentally makes the middleware sync
 *    or introduces a deadlock, tests will fail immediately.
 */
