import type { TeamId } from '@domain/ids'
import { TeamCityNameSchema, TeamFoundedYearYearSchema, TeamNameNameSchema } from '@value-objects/team'
import { z } from 'zod'
import type { PaginatedResponse } from './pagination.dto.js'

export const CreateTeamDTOSchema = z.object({
  city: TeamCityNameSchema,
  foundedYear: TeamFoundedYearYearSchema.optional().nullable(),
  name: TeamNameNameSchema,
})

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>

export const UpdateTeamDTOSchema = z.object({
  city: TeamCityNameSchema.optional(),
  foundedYear: TeamFoundedYearYearSchema.optional().nullable(),
  name: TeamNameNameSchema.optional(),
})

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>

export interface TeamResponseDTO {
  id: TeamId
  name: string
  city: string
  foundedYear: number | null
  createdAt: string // ISO string for JSON serialization
  updatedAt: string // ISO string for JSON serialization
}

export type TeamsListResponseDTO = PaginatedResponse<TeamResponseDTO, 'teams'>
