import { randomUUID } from 'node:crypto'
import { sql } from 'drizzle-orm'
import type { Database } from '../database/connection'

/**
 * Test Database Helpers
 *
 * Provides utilities for integration tests including:
 * - Safe database cleanup with advisory locking
 * - Unique test data generation to avoid conflicts
 */

const CLEANUP_LOCK_ID = 999999 // Arbitrary lock ID for test cleanup

/**
 * Clean database tables safely with advisory locking
 *
 * This function:
 * 1. Acquires a PostgreSQL advisory lock (blocks if another test is cleaning)
 * 2. Truncates all test tables with CASCADE
 * 3. Releases the lock
 *
 * Advisory locks allow multiple test files to run in parallel without conflicts.
 * Each test file will wait its turn to clean the database.
 *
 * @param db Database instance
 */
export async function cleanDatabase(db: Database): Promise<void> {
  try {
    // Acquire advisory lock (blocks until available)
    await db.execute(sql`SELECT pg_advisory_lock(${sql.raw(String(CLEANUP_LOCK_ID))})`)

    // Clean all tables
    await db.execute(sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`)
  } catch (error) {
    // Ignore errors (tables might not exist yet in first run)
    if (process.env.NODE_ENV === 'test') {
      // Only log in test environment to avoid noise
      console.warn('Database cleanup warning:', error)
    }
  } finally {
    // Always release the lock, even if truncate failed
    try {
      await db.execute(sql`SELECT pg_advisory_unlock(${sql.raw(String(CLEANUP_LOCK_ID))})`)
    } catch {
      // Ignore unlock errors
    }
  }
}

/**
 * Generate unique test identifier
 *
 * When tests run in parallel, they need unique IDs/emails to avoid conflicts.
 * This returns a short unique string suitable for test data.
 *
 * @returns Unique string (8 characters from UUID)
 */
export function uniqueTestId(): string {
  return randomUUID().slice(0, 8)
}
