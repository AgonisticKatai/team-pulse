import type { ValidationError } from '@errors/ValidationError.js'
import type { Result } from '@result'
import { z } from 'zod'

/**
 * Factory function type for creating domain ID branded types
 *
 * @template T - The branded type (TeamId, UserId, RefreshTokenId, etc.)
 * @param id - String ID to validate and convert
 * @returns Result with branded type or ValidationError
 */
type DomainIdFactory<T> = (id: string) => Result<T, ValidationError>

/**
 * Creates a Zod schema that validates UUID strings and transforms them to domain branded types
 *
 * This is the key piece connecting the "dirty world" (HTTP/strings) to the "clean world" (Domain/Branded Types).
 *
 * Usage:
 * ```typescript
 * // Define schema
 * export const TeamIdSchema = createIdSchema(TeamId.create)
 *
 * // In routes
 * const { id } = TeamParamsSchema.parse(request.params) // string → TeamId
 * ```
 *
 * Benefits:
 * - Validates UUID format at HTTP boundary
 * - Transforms to branded type automatically
 * - Type-safe throughout the application
 * - Proper error handling using Zod's error system
 * - No type assertions needed
 *
 * @template T - The branded type to create
 * @param factory - Domain factory function (e.g., TeamId.create)
 * @returns Zod schema that validates and transforms to branded type
 */
export const createIdSchema = <T>(factory: DomainIdFactory<T>) => {
  return z
    .string()
    .uuid({
      message: 'ID must be a valid UUID',
    })
    .transform((val, ctx) => {
      const result = factory(val)

      if (!result.ok) {
        // ✅ Use Zod's error system instead of throwing
        // This ensures proper error formatting in HTTP responses (400 vs 500)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result.error.message,
        })
        return z.NEVER // Type-safe way to indicate validation failure
      }

      return result.value // Returns branded type (TeamId, UserId, etc.)
    })
}
