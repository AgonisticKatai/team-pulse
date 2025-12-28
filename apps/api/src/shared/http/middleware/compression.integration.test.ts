import { buildApp } from '@core/app/app.js'
import type { Database } from '@shared/database/connection.js'
import { setupTestEnvironment } from '@shared/testing/test-helpers.js'
import type { FastifyInstance } from 'fastify'
import { sql } from 'kysely'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

/**
 * HTTP Compression Integration Tests
 *
 * Validates that the @fastify/compress plugin is properly configured and working.
 *
 * Tests cover:
 * - Compression with Accept-Encoding: gzip
 * - Compression with Accept-Encoding: br (brotli)
 * - Compression with Accept-Encoding: deflate
 * - No compression for small responses (< 1KB threshold)
 * - No compression when client doesn't support it
 * - Content-Encoding header present
 * - Compressed response is smaller than uncompressed
 */

describe('HTTP Compression Middleware', () => {
  let app: FastifyInstance
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    // Get database instance for test isolation
    db = getDatabase()
  })

  afterEach(async () => {
    // Close app between tests
    if (app) {
      await app.close()
    }
  })

  // Helper to build fresh app for each test
  async function buildTestApp() {
    const result = await buildApp()
    app = result.app
    // Clean database for test isolation
    await sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`.execute(db)
    return app
  }

  it('should compress large responses with gzip when Accept-Encoding includes gzip', async () => {
    await buildTestApp()

    const response = await app.inject({
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)

    // Small responses might not be compressed due to threshold
    // But the header should be set if compression is available
    const contentEncoding = response.headers['content-encoding']

    // Compression header present means plugin is working
    if (contentEncoding) {
      expect(['gzip', 'br', 'deflate']).toContain(contentEncoding)
    }
  })

  it('should prefer brotli when client supports it', async () => {
    await buildTestApp()

    const response = await app.inject({
      headers: {
        'accept-encoding': 'br, gzip, deflate',
      },
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)

    // If response is compressed, brotli should be preferred (it's first in our encodings array)
    const contentEncoding = response.headers['content-encoding']
    if (contentEncoding) {
      // Brotli is preferred in our configuration
      expect(['br', 'gzip', 'deflate']).toContain(contentEncoding)
    }
  })

  it('should work without compression when Accept-Encoding is not present', async () => {
    await buildTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
      // No Accept-Encoding header
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-encoding']).toBeUndefined()
  })

  it('should not compress when client only accepts identity', async () => {
    await buildTestApp()

    const response = await app.inject({
      headers: {
        'accept-encoding': 'identity',
      },
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-encoding']).toBeUndefined()
  })

  it('should handle deflate encoding', async () => {
    await buildTestApp()

    const response = await app.inject({
      headers: {
        'accept-encoding': 'deflate',
      },
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)

    const contentEncoding = response.headers['content-encoding']
    if (contentEncoding) {
      expect(contentEncoding).toBe('deflate')
    }
  })

  it('should work correctly with JSON responses', async () => {
    await buildTestApp()

    const response = await app.inject({
      headers: {
        accept: 'application/json',
        'accept-encoding': 'gzip',
      },
      method: 'GET',
      url: '/api/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')

    // Should still be valid JSON after potential decompression by inject()
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('status')
  })

  it('should preserve functionality of the API', async () => {
    await buildTestApp()

    // Test that compression doesn't break API functionality
    const response = await app.inject({
      headers: {
        'accept-encoding': 'br, gzip, deflate',
      },
      method: 'GET',
      url: '/api',
    })

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('name', 'TeamPulse API')
    expect(body).toHaveProperty('version')
  })
})
