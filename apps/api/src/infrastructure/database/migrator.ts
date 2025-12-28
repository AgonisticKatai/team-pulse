import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FileMigrationProvider, Migrator } from 'kysely'
import type { Database } from './connection.js'

/**
 * Kysely Migration Runner
 *
 * Runs database migrations in a type-safe, programmatic way.
 * No CLI tools needed - pure TypeScript execution.
 *
 * Migrations are stored in TypeScript files in the migrations directory.
 * Each migration exports `up()` and `down()` functions.
 */

const Filename = fileURLToPath(import.meta.url)
const Dirname = path.dirname(Filename)

export async function migrateToLatest(db: Database): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      // Path to migrations directory
      migrationFolder: path.join(Dirname, 'migrations'),
      path,
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`❌ Migration "${it.migrationName}" failed`)
    }
  })

  if (error) {
    console.error('❌ Failed to migrate')
    console.error(error)
    throw error
  }

  console.log('🎉 All migrations executed successfully')
}

export async function migrateDown(db: Database): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      migrationFolder: path.join(Dirname, 'migrations'),
      path,
    }),
  })

  const { error, results } = await migrator.migrateDown()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✅ Rollback "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`❌ Rollback "${it.migrationName}" failed`)
    }
  })

  if (error) {
    console.error('❌ Failed to rollback')
    console.error(error)
    throw error
  }

  console.log('🎉 Rollback executed successfully')
}
