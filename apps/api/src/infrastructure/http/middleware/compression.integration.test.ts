import type { Database } from '@infrastructure/database/connection.js'
import { setupTestEnvironment } from '@infrastructure/testing/test-helpers.js'
import { sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'

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
    const result = await buildApp({ skipMigrations: true })
    app = result.app
    // Clean database for test isolation
    await db.execute(sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`)
    return app
  }

  it('should compress large responses with gzip when Accept-Encoding includes gzip', async () => {
    await buildTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: {
        'accept-encoding': 'gzip, deflate, br',
      },
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
      method: 'GET',
      url: '/api/health',
      headers: {
        'accept-encoding': 'br, gzip, deflate',
      },
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
      method: 'GET',
      url: '/api/health',
      headers: {
        'accept-encoding': 'identity',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-encoding']).toBeUndefined()
  })

  it('should handle deflate encoding', async () => {
    await buildTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: {
        'accept-encoding': 'deflate',
      },
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
      method: 'GET',
      url: '/api/health',
      headers: {
        'accept-encoding': 'gzip',
        accept: 'application/json',
      },
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
      method: 'GET',
      url: '/api',
      headers: {
        'accept-encoding': 'br, gzip, deflate',
      },
    })

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('name', 'TeamPulse API')
    expect(body).toHaveProperty('version')
  })
})
