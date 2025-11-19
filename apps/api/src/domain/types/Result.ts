/**
 * Result type utilities
 *
 * This file re-exports Result from @team-pulse/shared to maintain backward compatibility
 * and add domain-specific utilities if needed.
 *
 * The Result type is now defined in the shared package and can be used across the monorepo.
 */
export type { Result } from '@team-pulse/shared'
export { collect, Err, flatMap, isError, isOk, map, Ok, unwrap, unwrapOr } from '@team-pulse/shared'
