import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

/**
 * Database connection factory
 *
 * Creates a PostgreSQL connection using the provided DATABASE_URL.
 * Used in all environments (local development, tests, and production).
 *
 * For local development, run PostgreSQL via Docker Compose.
 */
export function createDatabase(dbUrl: string): Database {
  const client = postgres(dbUrl, { max: 1 })
  return drizzle(client, { schema })
}

/**
 * Database instance type
 * Use this type for dependency injection
 */
export type Database = PostgresJsDatabase<typeof schema>
