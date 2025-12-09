import z from 'zod'
import { TEAM_CITY_VALIDATION_MESSAGES } from './TeamCity.constants.js'
import { TEAM_CITY_RULES } from './TeamCity.rules.js'

export const TeamCitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(TEAM_CITY_RULES.MIN_LENGTH, { message: TEAM_CITY_VALIDATION_MESSAGES.TOO_SHORT })
    .max(TEAM_CITY_RULES.MAX_LENGTH, { message: TEAM_CITY_VALIDATION_MESSAGES.TOO_LONG }),
})

export type TeamCityInput = z.infer<typeof TeamCitySchema>
