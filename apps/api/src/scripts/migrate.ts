/**
 * Standalone migration script for CI/CD pipelines
 *
 * This script runs database migrations independently of the application startup.
 * It should be executed as a separate step in the deployment pipeline before
 * deploying new application instances.
 *
 * Benefits:
 * - Avoids race conditions when multiple app instances start simultaneously
 * - Prevents slow startups due to long-running migrations
 * - Fails the deployment pipeline if migrations fail (before deploying broken code)
 * - Allows migrations to run with elevated database privileges if needed
 *
 * Usage:
 *   npm run db:migrate        # Production (reads from environment)
 *   npm run db:migrate:dev    # Development (reads from .env file)
 *
 * Exit codes:
 *   0 - Migrations completed successfully
 *   1 - Migration failed (stops CI/CD pipeline)
 */

import { validateEnv } from '@infrastructure/config/env.js'
import { runMigrations } from '@infrastructure/database/migrate.js'

// Self-executing async function to use top-level await
;(async () => {
  try {
    console.log('🏁 Starting standalone migration script...')

    // 1. Validate environment variables
    const env = validateEnv()

    // 2. Run migrations
    await runMigrations(env.DATABASE_URL)

    console.log('✨ Standalone migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('🔥 Fatal: Migration script failed!')
    console.error(error)

    // Exit with code 1 to signal failure to CI/CD pipeline
    // This prevents deployment of a new version with incompatible schema
    process.exit(1)
  }
})()
