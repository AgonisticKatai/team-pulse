#!/usr/bin/env tsx
/**
 * Standalone migration script
 *
 * This script can be run manually to apply database migrations:
 * ```bash
 * npm run db:migrate:run
 * # or
 * tsx src/scripts/run-migrations.ts
 * ```
 *
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 *
 * This is useful for:
 * - Running migrations in CI/CD pipelines
 * - Manual database schema updates
 * - Testing migrations before deployment
 */

import { runMigrations } from '@infrastructure/database/migrate.js'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required')
  process.exit(1)
}

try {
  await runMigrations(DATABASE_URL)
  process.exit(0)
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}
