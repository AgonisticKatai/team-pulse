import { TeamIdSchema, UserIdSchema } from '@team-pulse/shared'
import { z } from 'zod'

/**
 * Request Parameter Schemas
 *
 * These schemas validate and transform URL parameters from the HTTP boundary
 * into domain branded types.
 *
 * Architecture:
 * - HTTP layer receives string parameters
 * - Schemas validate format (UUID) and transform to branded types
 * - Use cases receive properly typed branded IDs
 *
 * This is the "pieza clave" (key piece) connecting dirty world (HTTP/strings)
 * to clean world (Domain/Branded Types).
 */

/**
 * Schema for team ID parameter
 *
 * Validates UUID format and transforms string → TeamId branded type
 *
 * Usage:
 * ```typescript
 * const { id } = TeamIdParamsSchema.parse(request.params)
 * // id is now TeamId, not string
 * await getTeamUseCase.execute({ id })
 * ```
 */
export const TeamIdParamsSchema = z.object({
  id: TeamIdSchema, // string → TeamId
})

/**
 * Schema for user ID parameter
 *
 * Validates UUID format and transforms string → UserId branded type
 */
export const UserIdParamsSchema = z.object({
  id: UserIdSchema, // string → UserId
})
