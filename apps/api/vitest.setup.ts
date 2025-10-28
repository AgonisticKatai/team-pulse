/**
 * Vitest setup file
 *
 * This file runs before all tests and sets up the test environment.
 * It ensures DATABASE_URL is properly configured for both local and CI environments.
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'

// Set DATABASE_URL if not already set
// In CI: Will use postgresql:// from workflow env vars
// Locally: Will default to :memory: for SQLite
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = ':memory:'
  console.log('Using SQLite in-memory database for tests')
} else {
  console.log(`Using database: ${process.env.DATABASE_URL.substring(0, 20)}...`)
}
