import { createIdSchema } from '@domain/utils/zod-id.factory.js'
import { RefreshTokenId } from './RefreshTokenId.js'

/**
 * Zod schema for RefreshTokenId
 *
 * Validates that a string is a valid UUID and transforms it to a RefreshTokenId branded type.
 *
 * Usage in HTTP routes:
 * ```typescript
 * const RefreshTokenParamsSchema = z.object({
 *   id: RefreshTokenIdSchema
 * })
 *
 * const { id } = RefreshTokenParamsSchema.parse(request.params) // id is RefreshTokenId
 * ```
 */
export const RefreshTokenIdSchema = createIdSchema(RefreshTokenId.create)
