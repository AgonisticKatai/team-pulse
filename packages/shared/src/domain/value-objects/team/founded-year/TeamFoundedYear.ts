import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamFoundedYearInput, TeamFoundedYearSchema } from './TeamFoundedYear.schema.js'
import type { TeamFoundedYearProps } from './TeamFoundedYear.types.js'

export class TeamFoundedYear {
  readonly year: number

  private constructor(props: TeamFoundedYearProps) {
    this.year = props.year
  }

  static create(input: TeamFoundedYearInput): Result<TeamFoundedYear, ValidationError> {
    const validation = TeamFoundedYearSchema.safeParse(input)

    if (!validation.success) {
      return Err(
        ValidationError.fromZodError({
          error: validation.error,
        }),
      )
    }

    return Ok(new TeamFoundedYear(validation.data))
  }

  getValue(): TeamFoundedYearProps {
    return { year: this.year }
  }
}
