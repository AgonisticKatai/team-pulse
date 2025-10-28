/**
 * Vitest setup file
 *
 * This file runs before all tests and sets up the test environment.
 * It ensures DATABASE_URL is properly configured for both local and CI environments.
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'

// Configure DATABASE_URL for tests
// In CI: Set by GitHub Actions workflow
// Locally: Use Docker Compose database or set via environment variable
if (!process.env.DATABASE_URL) {
  // Default to Docker Compose test database for local development
  process.env.DATABASE_URL = 'postgresql://teampulse:teampulse@localhost:5432/teampulse'
  console.log(
    '⚠️  DATABASE_URL not set, using Docker Compose default: postgresql://teampulse:teampulse@localhost:5432/teampulse',
  )
  console.log('💡 Make sure PostgreSQL is running: docker compose up -d')
}

// Validate it's a PostgreSQL URL
if (!process.env.DATABASE_URL.startsWith('postgres')) {
  throw new Error(
    `DATABASE_URL must be a PostgreSQL connection string (starting with postgresql:// or postgres://).
Current value: ${process.env.DATABASE_URL}`,
  )
}

console.log(`Using PostgreSQL: ${process.env.DATABASE_URL.substring(0, 30)}...`)
