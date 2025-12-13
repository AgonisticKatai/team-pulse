import { TeamNameSchema } from '@value-objects/team'
import { z } from 'zod'
import { EntityIdSchema, TimestampsSchema } from './entity-base.dto'
import { createPaginatedResponseSchema } from './pagination.dto'

// 1. CORE
const TeamCore = z.object({ name: TeamNameSchema })

// 2. INPUTS
export const CreateTeamSchema = TeamCore.strict()
export type CreateTeamDTO = z.infer<typeof CreateTeamSchema>

export const UpdateTeamSchema = TeamCore.partial().strict()
export type UpdateTeamDTO = z.infer<typeof UpdateTeamSchema>

// 3. OUTPUTS
export const TeamResponseSchema = EntityIdSchema.merge(TeamCore).merge(TimestampsSchema)

export type TeamResponseDTO = z.infer<typeof TeamResponseSchema>

// 4. LIST
export const TeamsListResponseSchema = createPaginatedResponseSchema(TeamResponseSchema)
export type TeamsListResponseDTO = z.infer<typeof TeamsListResponseSchema>
