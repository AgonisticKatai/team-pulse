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
export async function createDatabase(dbUrl: string): Promise<Database> {
  // Detect database type from URL
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')

  if (isPostgres) {
    // PostgreSQL connection (for tests and production)
    const client = postgres(dbUrl, { max: 1 })
    return drizzlePostgres(client, { schema }) as Database
  }

  // SQLite connection (for development) - all imports are dynamic to avoid loading in CI
  try {
    const [{ default: SQLiteDatabase }, { drizzle: drizzleSqlite }] = await Promise.all([
      import('better-sqlite3'),
      import('drizzle-orm/better-sqlite3'),
    ])

    const sqlite = new SQLiteDatabase(dbUrl)

    // Enable WAL mode for better performance
    sqlite.pragma('journal_mode = WAL')

    return drizzleSqlite(sqlite, { schema }) as Database
  } catch (error) {
    throw new Error(
      `Failed to load SQLite dependencies. Make sure better-sqlite3 is installed.
If you're in CI/test environment, set DATABASE_URL to a PostgreSQL URL.
Current DATABASE_URL: ${dbUrl}
Error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Database instance type
 * Use this type for dependency injection
 *
 * Union type that supports both SQLite and PostgreSQL
 */
// biome-ignore lint/suspicious/noExplicitAny: SQLite type loaded dynamically to avoid CI errors
export type Database = PostgresJsDatabase<typeof schema> | any
