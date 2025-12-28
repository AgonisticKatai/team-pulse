/**
 * Shared Infrastructure Module
 *
 * Infrastructure components shared across all features:
 * - Database connection and schema
 * - Monitoring and metrics
 * - HTTP middleware
 * - Logging
 * - Configuration
 * - Security contracts (interfaces)
 * - Testing utilities
 */

export * from './config/index.js'
export * from './database/index.js'
export * from './http/index.js'
export * from './logging/index.js'
export * from './monitoring/index.js'
export * from './security/index.js'
export * from './testing/index.js'
