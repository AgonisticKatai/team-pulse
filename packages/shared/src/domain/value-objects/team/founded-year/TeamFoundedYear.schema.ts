import { z } from 'zod'
import { TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES } from './TeamFoundedYear.constants.js'
import { TEAM_FOUNDED_YEAR_RULES } from './TeamFoundedYear.rules.js'

const yearSchema = z.coerce
  .number()
  .int()
  .min(TEAM_FOUNDED_YEAR_RULES.MIN, { message: TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES.MIN })
  .max(TEAM_FOUNDED_YEAR_RULES.currentMaxYear, { message: TEAM_FOUNDED_YEAR_VALIDATION_MESSAGES.MAX })

export const yearSchemaOptional = yearSchema.nullable().optional()

export const TeamFoundedYearSchema = z.object({ year: yearSchema })
export const TeamFoundedYearOptionalSchema = z.object({ year: yearSchemaOptional })

export type TeamFoundedYearInput = z.infer<typeof TeamFoundedYearSchema>
export type TeamFoundedYearOptionalInput = z.infer<typeof TeamFoundedYearOptionalSchema>
