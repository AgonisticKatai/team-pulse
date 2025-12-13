import { z } from 'zod'

export const EntityIdSchema = z.object({
  id: z.uuid(),
})

export const TimestampsSchema = z.object({
  createdAt: z.date().transform((d) => d.toISOString()),
  updatedAt: z.date().transform((d) => d.toISOString()),
})
