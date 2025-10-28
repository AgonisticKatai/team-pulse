/**
 * Vitest setup file
 *
 * This file runs before all tests and sets up the test environment.
 * It ensures DATABASE_URL is properly configured for both local and CI environments.
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'

// Verify DATABASE_URL is set to PostgreSQL
// In CI: Set by GitHub Actions workflow
// Locally: Set via environment variable or .env file
if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is required for tests. Please set it to a PostgreSQL connection string.
Example: DATABASE_URL=postgresql://test:test@localhost:5432/test`,
  )
}

if (!process.env.DATABASE_URL.startsWith('postgres')) {
  throw new Error(
    `DATABASE_URL must be a PostgreSQL connection string (starting with postgresql:// or postgres://).
Current value: ${process.env.DATABASE_URL}`,
  )
}

console.log(`Using PostgreSQL: ${process.env.DATABASE_URL.substring(0, 30)}...`)
