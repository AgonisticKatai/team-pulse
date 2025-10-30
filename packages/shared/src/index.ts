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

// Export all types (type-only exports)
export type { UserRole, HealthCheckResponse, Match } from './types/index.js'

// Export all DTOs (with Zod schemas - includes both runtime and types)
export * from './dtos/index.js'
