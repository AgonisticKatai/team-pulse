import { PaginationLimitSchema, PaginationPageSchema } from '@value-objects/common/pagination'
import { z } from 'zod'

// 1. INPUT
export const PaginationQuerySchema = z.object({
  limit: PaginationLimitSchema,
  page: PaginationPageSchema,
})
export type PaginationQueryDTO = z.infer<typeof PaginationQuerySchema>

// 2. OUTPUT
const PaginationMetaSchema = z.object({
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
  limit: z.number(),
  page: z.number(),
  total: z.number(),
  totalPages: z.number(),
})
export type PaginationMetaDTO = z.infer<typeof PaginationMetaSchema>

// 3. FACTORY
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  })
}
