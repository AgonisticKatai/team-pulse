import type { TeamId } from '@value-objects/team'
import { TeamNameSchema } from '@value-objects/team'
import { z } from 'zod'
import type { PaginatedResponse } from './pagination.dto.js'

export const CreateTeamDTOSchema = z.object({ name: TeamNameSchema })

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>

export const UpdateTeamDTOSchema = z.object({ name: TeamNameSchema.optional() })

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>

export interface TeamResponseDTO {
  id: TeamId
  name: string
  createdAt: string // ISO string for JSON serialization
  updatedAt: string // ISO string for JSON serialization
}

export type TeamsListResponseDTO = PaginatedResponse<TeamResponseDTO, 'teams'>
