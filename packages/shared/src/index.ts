/**
 * @team-pulse/shared
 *
 * Shared package containing:
 * - DTOs with Zod validation schemas (dtos/)
 * - Common domain types (types/)
 *
 * This package is consumed by both:
 * - @team-pulse/api (backend)
 * - @team-pulse/web (frontend)
 */

// Export all DTOs (with Zod schemas - includes both runtime and types)
export * from './dtos/index.js'

// Export testing utilities
export * from './testing/index.js'

// Export all types (type-only exports)
export type { HealthCheckResponse, Match, UserRole } from './types/index.js'

// Export Result type and helpers
export { collect, Err, flatMap, isError, isOk, map, Ok, type Result, unwrap, unwrapOr } from './types/Result.js'
