import * as schema from '@infrastructure/database/schema.js'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

/**
 * Database connection factory
 *
 * Creates a PostgreSQL connection using the provided DATABASE_URL.
 * Used in all environments (local development, tests, and production).
 *
 * For local development, run PostgreSQL via Docker Compose.
 *
 * Connection pooling configuration:
 * - Production: 20 connections (scales with load)
 * - Test: 5 connections (isolated tests)
 * - Development: 10 connections (local work)
 */
export function createDatabase(dbUrl: string, options?: DatabaseOptions): Database {
  const isTest = process.env.NODE_ENV === 'test'
  const isProduction = process.env.NODE_ENV === 'production'

  // Determine pool size based on environment
  const defaultMax = isTest ? 5 : isProduction ? 20 : 10

  const client = postgres(dbUrl, {
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    connect_timeout: options?.connectTimeout ?? 10,
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    idle_timeout: options?.idleTimeout ?? 20,
    max: options?.max ?? defaultMax,
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    max_lifetime: options?.maxLifetime ?? 60 * 30,
    ...options?.postgres,
  })

  return drizzle(client, { schema })
}

/**
 * Options for database connection
 */
export interface DatabaseOptions {
  /** Maximum number of connections in pool (default: env-based) */
  max?: number
  /** Seconds to wait before closing idle connections (default: 20) */
  idleTimeout?: number
  /** Seconds before recycling a connection (default: 1800) */
  maxLifetime?: number
  /** Seconds to wait for connection (default: 10) */
  connectTimeout?: number
  /** Additional postgres.js options */
  postgres?: postgres.Options<Record<string, postgres.PostgresType>>
}

/**
 * Database instance type
 * Use this type for dependency injection
 */
export type Database = PostgresJsDatabase<typeof schema>
