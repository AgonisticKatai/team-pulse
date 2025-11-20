/**
 * @team-pulse/shared
 *
 * Shared package for TeamPulse monorepo.
 *
 * IMPORTANT: This package uses organized subpath exports.
 * Do NOT import from '@team-pulse/shared' directly.
 *
 * Available subpath exports:
 *
 * ## Core Types & DTOs
 * - @team-pulse/shared/result         → Result<T,E>, Ok, Err, map, flatMap, etc.
 * - @team-pulse/shared/dtos           → DTOs with Zod schemas (CreateUserDTO, LoginDTO, etc.)
 * - @team-pulse/shared/types          → Common types (HealthCheckResponse, UserRole, etc.)
 *
 * ## Testing Utilities
 * - @team-pulse/shared/testing/helpers      → expectSuccess, expectError, assertDefined, etc.
 * - @team-pulse/shared/testing/constants    → TEST_CONSTANTS
 * - @team-pulse/shared/testing/dto-builders → buildCreateUserDTO, buildLoginDTO, etc.
 *
 * @example
 * ```typescript
 * // ✅ CORRECT - Use specific subpath exports
 * import { Result, Ok, Err } from '@team-pulse/shared/result'
 * import { CreateUserDTO, LoginDTO } from '@team-pulse/shared/dtos'
 * import { expectSuccess } from '@team-pulse/shared/testing/helpers'
 * import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
 *
 * // ❌ INCORRECT - Don't import from main entry
 * import { Result, CreateUserDTO } from '@team-pulse/shared'
 * ```
 */

// This file intentionally left empty.
// Use the subpath exports documented above.
