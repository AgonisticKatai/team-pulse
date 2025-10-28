import SQLiteDatabase from 'better-sqlite3'
import { type BetterSQLite3Database, drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { type PostgresJsDatabase, drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

/**
 * Database connection factory
 *
 * Supports both SQLite (development) and PostgreSQL (tests/production):
 * - SQLite: DATABASE_URL=./data/db.sqlite or :memory:
 * - PostgreSQL: DATABASE_URL=postgresql://user:pass@host:port/db
 */
export function createDatabase(dbUrl: string): Database {
  // Detect database type from URL
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')

  if (isPostgres) {
    // PostgreSQL connection (for tests and production)
    const client = postgres(dbUrl, { max: 1 })
    return drizzlePostgres(client, { schema }) as Database
  }

  // SQLite connection (for development)
  const sqlite = new SQLiteDatabase(dbUrl)

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL')

  return drizzleSqlite(sqlite, { schema }) as Database
}

/**
 * Database instance type
 * Use this type for dependency injection
 *
 * Union type that supports both SQLite and PostgreSQL
 */
export type Database = BetterSQLite3Database<typeof schema> | PostgresJsDatabase<typeof schema>
