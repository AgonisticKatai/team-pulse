import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema.js'

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
 */
export async function runMigrations(dbUrl: string): Promise<void> {
  // Create a dedicated connection for migrations
  const migrationClient = postgres(dbUrl, { max: 1 })
  const db = drizzle(migrationClient, { schema })

  try {
    console.log('🔄 Running database migrations...')

    // Run all pending migrations
    await migrate(db, { migrationsFolder: './drizzle' })

    console.log('✅ Migrations completed successfully')
  } catch (error) {
    // Handle the case where tables already exist (e.g., from using db:push or previous migration runs)
    // PostgreSQL error code 42P07 = duplicate_table
    // This is graceful - it means the database schema is already up-to-date
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorCause = error && typeof error === 'object' && 'cause' in error ? error.cause : null
    const postgresCode = errorCause && typeof errorCause === 'object' && 'code' in errorCause ? errorCause.code : null

    if (errorMessage.includes('already exists') || postgresCode === '42P07') {
      console.log('ℹ️  Database schema already exists (skipping migrations)')
      return
    }

    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Close the migration connection
    await migrationClient.end()
  }
}
