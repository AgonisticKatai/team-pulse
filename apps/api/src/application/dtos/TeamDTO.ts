import { z } from 'zod'

/**
 * Team Data Transfer Objects (DTOs)
 *
 * DTOs serve as the CONTRACT between layers:
 * - API Layer → Application Layer: Request DTOs
 * - Application Layer → API Layer: Response DTOs
 *
 * Why separate from Domain Models?
 * 1. API contracts can change without affecting domain
 * 2. Domain models may contain logic not suitable for serialization
 * 3. One domain model might map to multiple DTOs (different views)
 * 4. Input validation happens here, domain validation is separate
 *
 * These DTOs use Zod for runtime validation.
 */

/**
 * Schema for creating a new team
 *
 * This validates INPUT data from HTTP requests
 */
export const CreateTeamDTOSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name cannot exceed 100 characters')
    .trim(),

  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters').trim(),

  foundedYear: z
    .number()
    .int('Founded year must be an integer')
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .optional()
    .nullable(),
})

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>

/**
 * Schema for updating a team
 *
 * All fields are optional (partial update)
 */
export const UpdateTeamDTOSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name cannot be empty')
    .max(100, 'Team name cannot exceed 100 characters')
    .trim()
    .optional(),

  city: z
    .string()
    .min(1, 'City cannot be empty')
    .max(100, 'City cannot exceed 100 characters')
    .trim()
    .optional(),

  foundedYear: z
    .number()
    .int('Founded year must be an integer')
    .min(1800, 'Founded year must be after 1800')
    .max(new Date().getFullYear(), 'Founded year cannot be in the future')
    .optional()
    .nullable(),
})

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>

/**
 * Response DTO for a team
 *
 * This is what gets sent to clients
 */
export interface TeamResponseDTO {
  id: string
  name: string
  city: string
  foundedYear: number | null
  createdAt: string // ISO string for JSON serialization
  updatedAt: string // ISO string for JSON serialization
}

/**
 * List of teams response
 */
export interface TeamsListResponseDTO {
  teams: TeamResponseDTO[]
  total: number
}
