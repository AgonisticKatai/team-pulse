import z from 'zod'
import { TEAM_NAME_VALIDATION_MESSAGES } from './TeamName.constants.js'
import { TEAM_NAME_RULES } from './TeamName.rules.js'

export const TeamNameNameSchema = z
  .string()
  .trim()
  .min(TEAM_NAME_RULES.MIN_LENGTH, { message: TEAM_NAME_VALIDATION_MESSAGES.MIN_LENGTH })
  .max(TEAM_NAME_RULES.MAX_LENGTH, { message: TEAM_NAME_VALIDATION_MESSAGES.MAX_LENGTH })

export const TeamNameSchema = z.object({ name: TeamNameNameSchema })

export type TeamNameInput = z.infer<typeof TeamNameSchema>
