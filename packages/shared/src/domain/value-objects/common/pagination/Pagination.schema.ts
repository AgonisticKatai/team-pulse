import { z } from 'zod'
import { PAGINATION_RULES } from './Pagination.rules.js'

export const PaginationLimitSchema = z.coerce
  .number()
  .int()
  .min(PAGINATION_RULES.MIN_LIMIT)
  .max(PAGINATION_RULES.MAX_LIMIT)
  .default(PAGINATION_RULES.DEFAULT_LIMIT)
  .catch(PAGINATION_RULES.DEFAULT_LIMIT)

export const PaginationPageSchema = z.coerce
  .number()
  .int()
  .min(PAGINATION_RULES.MIN_PAGE)
  .default(PAGINATION_RULES.DEFAULT_PAGE)
  .catch(PAGINATION_RULES.DEFAULT_PAGE)

export const PaginationTotalSchema = z.coerce
  .number()
  .int()
  .min(PAGINATION_RULES.MIN_TOTAL)
  .default(PAGINATION_RULES.DEFAULT_TOTAL)

export const PaginationSchema = z.object({
  limit: PaginationLimitSchema,
  page: PaginationPageSchema,
  total: PaginationTotalSchema,
})

export type PaginationInput = z.infer<typeof PaginationSchema>
