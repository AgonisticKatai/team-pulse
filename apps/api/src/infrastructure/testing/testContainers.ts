import { execSync } from 'node:child_process'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { type Database, createDatabase } from '../database/connection.js'

/**
 * Test Container Setup for Integration Tests
 *
 * Provides isolated PostgreSQL containers per test suite for true test isolation.
 * This allows tests to run in parallel without conflicts or race conditions.
 *
 * Benefits:
 * - Complete test isolation (each suite gets its own database)
 * - No shared state between test files
 * - Tests can run in parallel safely
 * - Matches production environment more closely
 *
 * Usage:
 * ```typescript
 * describe('My test suite', () => {
 *   let db: Database
 *   let cleanup: () => Promise<void>
 *
 *   beforeAll(async () => {
 *     const result = await setupTestContainer()
 *     db = result.db
 *     cleanup = result.cleanup
 *   })
 *
 *   afterAll(async () => {
 *     await cleanup()
 *   })
 * })
 * ```
 */

interface TestContainerResult {
  db: Database
  container: StartedPostgreSqlContainer
  cleanup: () => Promise<void>
}

/**
 * Sets up an isolated PostgreSQL container for testing
 *
 * This function:
 * 1. Starts a PostgreSQL container with testcontainers
 * 2. Pushes the database schema using drizzle-kit
 * 3. Returns a database instance and cleanup function
 *
 * The container is automatically cleaned up when cleanup() is called.
 *
 * @returns Object with database instance, container, and cleanup function
 */
export async function setupTestContainer(): Promise<TestContainerResult> {
  // Start PostgreSQL container
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withExposedPorts(5432)
    .withStartupTimeout(120_000) // 2 minutes timeout
    .start()

  const connectionUri = container.getConnectionUri()

  // Push schema to the container using drizzle-kit
  try {
    execSync(`DATABASE_URL="${connectionUri}" pnpm db:push`, {
      cwd: process.cwd(),
      stdio: 'pipe', // Suppress output
      encoding: 'utf-8',
    })
  } catch (error) {
    // If push fails, stop the container and rethrow
    await container.stop()
    throw new Error(`Failed to push schema to test container: ${error}`)
  }

  // Create database instance
  const db = createDatabase(connectionUri)

  // Cleanup function
  const cleanup = async () => {
    await container.stop()
  }

  return { db, container, cleanup }
}
