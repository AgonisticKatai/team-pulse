import { createIdSchema } from '@domain/utils/zod-id.factory.js'
import { UserId } from './UserId.js'

/**
 * Zod schema for UserId
 *
 * Validates that a string is a valid UUID and transforms it to a UserId branded type.
 *
 * Usage in HTTP routes:
 * ```typescript
 * const UserParamsSchema = z.object({
 *   id: UserIdSchema
 * })
 *
 * const { id } = UserParamsSchema.parse(request.params) // id is UserId
 * ```
 */
export const UserIdSchema = createIdSchema(UserId.create)
