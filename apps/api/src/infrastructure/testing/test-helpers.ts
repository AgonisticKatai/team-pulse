import type { Database } from '@infrastructure/database/connection.js'
import { setupTestContainer } from '@infrastructure/testing/test-containers.js'
import { afterAll, beforeAll } from 'vitest'

/**
 * Test Environment Setup Helper
 *
 * Encapsulates common test setup logic to avoid duplication across test files.
 * This helper:
 * 1. Sets required environment variables
 * 2. Creates an isolated test container with PostgreSQL
 * 3. Configures DATABASE_URL to point to the test container
 * 4. Handles cleanup after all tests complete
 * 5. Optionally exposes database instance for tests that need direct DB access
 *
 * Usage (simple - no DB access needed):
 * ```typescript
 * describe('My Test Suite', () => {
 *   setupTestEnvironment()
 *
 *   it('should do something', async () => {
 *     // Your test code here
 *   })
 * })
 * ```
 *
 * Usage (with DB access for cleaning/truncating tables):
 * ```typescript
 * describe('My Test Suite', () => {
 *   const { getDatabase } = setupTestEnvironment()
 *
 *   beforeEach(async () => {
 *     const db = getDatabase()
 *     await sql`TRUNCATE TABLE users`.execute(db)
 *   })
 * })
 * ```
 *
 * Benefits:
 * - DRY: Single source of truth for test setup
 * - Consistency: All tests use the same configuration
 * - Maintainability: Changes propagate to all tests automatically
 * - Scalability: Easy to add new setup logic
 * - Flexible: Works for tests with or without direct DB access
 */
export function setupTestEnvironment(): { getDatabase: () => Database } {
  let cleanup: (() => Promise<void>) | undefined
  let db: Database | undefined

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars-long'

    // Create isolated test container
    const testContainer = await setupTestContainer()
    process.env.DATABASE_URL = testContainer.container.getConnectionUri()
    db = testContainer.db
    cleanup = testContainer.cleanup
  }, 120_000) // 2 minute timeout for container startup

  afterAll(async () => {
    // Clean up test container
    if (cleanup) {
      await cleanup()
    }
  })

  return {
    getDatabase: () => {
      if (!db) {
        throw new Error('Database not initialized. Make sure setupTestEnvironment() beforeAll hook has run.')
      }
      return db
    },
  }
}
