import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from '@infrastructure/database/schema.js'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Get the directory of this file (works with ESM)
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
 * - Uses relative path from this file's location (__dirname)
 * - Independent of where the process is executed from
 * - Works in both development and production (Vercel)
 */
export async function runMigrations(dbUrl: string): Promise<void> {
  // Create a dedicated connection for migrations
  const migrationClient = postgres(dbUrl, { max: 1 })
  const db = drizzle(migrationClient, { schema })

  // Resolve path to migrations folder relative to this file
  // From: apps/api/src/infrastructure/database/migrate.ts (or dist/infrastructure/database/migrate.js)
  // To:   apps/api/drizzle
  const migrationsPath = join(__dirname, '../../../drizzle')

  try {
    // Verify migrations folder exists before attempting to run migrations
    // This prevents obscure errors in production if the folder wasn't copied to the build
    if (!existsSync(migrationsPath)) {
      throw new Error(
        `Migrations folder not found: ${migrationsPath}. Ensure the drizzle/ folder is copied to your build output.`,
      )
    }

    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log('🔄 Running database migrations...')
    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log(`📂 Migrations folder: ${migrationsPath}`)

    // Run all pending migrations
    // Drizzle manages idempotency via the __drizzle_migrations table
    // If a migration already ran, it will be skipped automatically
    // If this throws an error, it means something is wrong and deployment should stop
    await migrate(db, { migrationsFolder: migrationsPath })

    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: migrations need console output for debugging
    console.error('❌ Migration failed:', error)
    // Re-throw to ensure the process exits with error code
    // This prevents the application from starting with an inconsistent database state
    throw error
  } finally {
    // Close the migration connection
    await migrationClient.end()
  }
}
