import { TeamId } from './TeamId.js'
import { createIdSchema } from '@domain/utils/zod-id.factory.js'

/**
 * Zod schema for TeamId
 *
 * Validates that a string is a valid UUID and transforms it to a TeamId branded type.
 *
 * Usage in HTTP routes:
 * ```typescript
 * const TeamParamsSchema = z.object({
 *   id: TeamIdSchema
 * })
 *
 * const { id } = TeamParamsSchema.parse(request.params) // id is TeamId
 * ```
 */
export const TeamIdSchema = createIdSchema(TeamId.create)
