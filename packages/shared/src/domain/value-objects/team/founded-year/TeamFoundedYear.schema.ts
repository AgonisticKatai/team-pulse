import { z } from 'zod'
import { TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES } from './TeamFoundedYear.constants.js'
import { TEAM_FOUNDED_YEAR_RULES } from './TeamFoundedYear.rules.js'

export const TeamFoundedYearSchema = z.object({
  year: z
    .number()
    .int()
    .min(TEAM_FOUNDED_YEAR_RULES.MIN, { message: TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES.MIN })
    .max(new Date().getFullYear(), { message: TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES.MAX }),
})

export type TeamFoundedYearInput = z.infer<typeof TeamFoundedYearSchema>
