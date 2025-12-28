#!/usr/bin/env tsx

/**
 * Kysely Migration Runner Script
 *
 * Runs all pending migrations to bring the database to the latest schema.
 * Pure TypeScript execution - no external CLI tools needed.
 *
 * Usage:
 *   pnpm db:migrate        (from package.json)
 *   tsx src/scripts/run-kysely-migrations.ts
 */

import { createDatabase } from '@shared/database/connection/connection.js'
import { migrateToLatest } from '@shared/database/migrations/migrator.js'

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://teampulse:teampulse@localhost:5432/teampulse'

  console.log('🚀 Starting database migration...')
  console.log(`📊 Database: ${connectionString.replace(/:[^:@]+@/, ':****@')}`)

  const db = createDatabase(connectionString)

  try {
    await migrateToLatest(db)
    console.log('✅ Database migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database migration failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

main()
