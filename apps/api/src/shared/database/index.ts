/**
 * Shared Database Infrastructure
 *
 * Database connection, schema, and migrations shared across all features.
 */

export { createDatabase, type Database } from './connection/index.js'
export * from './migrations/index.js'
export * from './schemas/index.js'
