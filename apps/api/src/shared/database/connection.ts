import { Kysely } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import postgres from 'postgres'
import type { Database as DatabaseSchema } from './kysely-schema.js'

/**
 * Kysely Database Connection Factory
 *
 * Creates a type-safe Kysely instance connected to PostgreSQL.
 * Pure TypeScript, zero DSLs, full type inference.
 *
 * Uses PostgresJSDialect (not PostgresDialect) for postgres.js compatibility.
 *
 * Used in all environments (local development, tests, and production).
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

  const pool = postgres(dbUrl, {
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    connect_timeout: options?.connectTimeout ?? 10,
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    idle_timeout: options?.idleTimeout ?? 20,
    max: options?.max ?? defaultMax,
    // biome-ignore lint/style/useNamingConvention: postgres.js API uses snake_case
    max_lifetime: options?.maxLifetime ?? 60 * 30,
    ...options?.postgres,
  })

  return new Kysely<DatabaseSchema>({
    dialect: new PostgresJSDialect({
      postgres: pool,
    }),
  })
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
 * Database instance type (Kysely)
 * Use this type for dependency injection
 */
export type Database = Kysely<DatabaseSchema>
