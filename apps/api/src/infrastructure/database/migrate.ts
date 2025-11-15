import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.js'

// Get the directory of this file (works with both ESM and CommonJS)
// biome-ignore lint: __filename is standard Node.js convention
const __filename = fileURLToPath(import.meta.url)
// biome-ignore lint: __dirname is standard Node.js convention
const __dirname = dirname(__filename)

/**
 * Run database migrations programmatically
 *
 * This function:
 * 1. Connects to the database
 * 2. Runs all pending migrations from the drizzle folder
 * 3. Closes the connection
 *
 * Migrations are executed in order:
 * - 0000_easy_madame_hydra.sql (teams table)
 * - 0001_messy_mother_askani.sql (users and refresh_tokens tables)
 * - ... future migrations
 *
 * Why programmatic migrations?
 * - Runs automatically on application startup
 * - No need to run manual CLI commands
 * - Ensures database is always up-to-date
 * - Works in all environments (dev, staging, production)
 *
 * Path resolution:
 * - Uses absolute path from this file's location
 * - Goes up to apps/api/ directory and finds drizzle/ folder
 * - Works in both development and production (Vercel)
 */
export async function runMigrations(dbUrl: string): Promise<void> {
  // Create a dedicated connection for migrations
  const migrationClient = postgres(dbUrl, { max: 1 })
  const db = drizzle(migrationClient, { schema })

  // Resolve absolute path to migrations folder
  // From: apps/api/src/infrastructure/database/migrate.ts
  // To:   apps/api/drizzle
  const migrationsPath = join(__dirname, '../../../drizzle')

  try {
    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log('🔄 Running database migrations...')
    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log(`📂 Migrations folder: ${migrationsPath}`)

    // Run all pending migrations
    await migrate(db, { migrationsFolder: migrationsPath })

    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    // Handle the case where tables already exist (e.g., from using db:push or previous migration runs)
    // PostgreSQL error code 42P07 = duplicate_table
    // This is graceful - it means the database schema is already up-to-date
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorCause = error && typeof error === 'object' && 'cause' in error ? error.cause : null
    const postgresCode = errorCause && typeof errorCause === 'object' && 'code' in errorCause ? errorCause.code : null

    if (errorMessage.includes('already exists') || postgresCode === '42P07') {
      // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
      console.log('ℹ️  Database schema already exists (skipping migrations)')
      return
    }

    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Close the migration connection
    await migrationClient.end()
  }
}
