import { ValidationError } from '@errors/ValidationError'
import type { Result } from '@result'
import { Err, Ok } from '@result'
import type { TeamFoundedYearInput, TeamFoundedYearOptionalInput } from './TeamFoundedYear.schema.js'
import { TeamFoundedYearOptionalSchema, TeamFoundedYearSchema } from './TeamFoundedYear.schema.js'
import type { TeamFoundedYearProps } from './TeamFoundedYear.types.js'

export class TeamFoundedYear {
  readonly year: number | null

  private constructor(props: TeamFoundedYearProps) {
    this.year = props.year
  }

  static create(input: TeamFoundedYearInput): Result<TeamFoundedYear, ValidationError> {
    const validation = TeamFoundedYearSchema.safeParse(input)

    if (!validation.success) {
      return Err(ValidationError.fromZodError({ error: validation.error }))
    }

    return Ok(new TeamFoundedYear(validation.data))
  }

  static createOptional(input: TeamFoundedYearOptionalInput): Result<TeamFoundedYear, ValidationError> {
    const validation = TeamFoundedYearOptionalSchema.safeParse(input)

    if (!validation.success) {
      return Err(ValidationError.fromZodError({ error: validation.error }))
    }

    return Ok(new TeamFoundedYear({ year: validation.data.year ?? null }))
  }

  isEmpty(): boolean {
    return this.year === null
  }

  getValue(): TeamFoundedYearProps {
    return { year: this.year }
  }
}
