import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamFoundedYearInput, TeamFoundedYearSchema } from './TeamFoundedYear.schema.js'
import type { TeamFoundedYearType } from './TeamFoundedYear.types.js'

export class TeamFoundedYear {
  private readonly value: TeamFoundedYearType

  private constructor({ value }: { value: TeamFoundedYearType }) {
    this.value = value
  }

  static create({ value }: { value: TeamFoundedYearInput }): Result<TeamFoundedYear, ValidationError> {
    const result = TeamFoundedYearSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.fromZodError({
          error: result.error,
        }),
      )
    }

    return Ok(new TeamFoundedYear({ value: result.data }))
  }

  getValue(): TeamFoundedYearType {
    return this.value
  }
}
