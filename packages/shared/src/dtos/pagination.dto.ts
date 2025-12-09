import { z } from 'zod'

/**
 * Pagination DTOs Module
 *
 * Provides reusable pagination types and schemas using modern TypeScript features:
 * - Generic types for type-safe paginated responses
 * - Mapped types for dynamic key names
 * - Zod schemas for runtime validation
 */

/**
 * Pagination Query Schema
 * Validates and transforms query parameters for pagination
 */
export const PaginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),
})

/**
 * Pagination Query Type
 * Inferred from the Zod schema
 */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

/**
 * Pagination Metadata
 * Contains information about the current page, total items, etc.
 */
export interface PaginationDTO {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Generic Paginated Response
 *
 * A modern, reusable type for paginated API responses using TypeScript generics
 * and mapped types.
 *
 * @template TData - The type of items in the paginated list
 * @template TKey - The key name for the data array (e.g., 'users', 'teams')
 *
 * @example
 * // Using with a specific key
 * type UsersListResponseDTO = PaginatedResponse<UserResponseDTO, 'users'>
 * // Result: { users: UserResponseDTO[], pagination: PaginationMetadata }
 *
 * @example
 * // Using with default key 'data'
 * type ItemsResponse = PaginatedResponse<Item>
 * // Result: { data: Item[], pagination: PaginationMetadata }
 */
export type PaginatedResponse<TData, TKey extends string = 'data'> = {
  [K in TKey]: TData[]
} & {
  pagination: PaginationDTO
}
