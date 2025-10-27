import SQLiteDatabase from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'

/**
 * Database connection factory
 *
 * Creates and configures the SQLite database connection.
 * In development: uses local SQLite file
 * In production: will use PostgreSQL (easily switchable with Drizzle)
 */
export function createDatabase(dbUrl: string) {
  // Create SQLite connection
  const sqlite = new SQLiteDatabase(dbUrl)

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL')

  // Create Drizzle instance with schema
  const db = drizzle(sqlite, { schema })

  return db
}

/**
 * Database instance type
 * Use this type for dependency injection
 */
export type Database = ReturnType<typeof createDatabase>
