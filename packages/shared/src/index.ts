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

// Export all types
export * from './types'

// Export all DTOs (with Zod schemas)
export * from './dtos'
