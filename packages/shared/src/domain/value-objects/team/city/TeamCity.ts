import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamCityInput, TeamCitySchema } from './TeamCity.schema.js'
import type { TeamCityProps } from './TeamCity.types.js'

export class TeamCity {
  readonly name: string

  private constructor(props: TeamCityProps) {
    this.name = props.name
  }

  static create(input: TeamCityInput): Result<TeamCity, ValidationError> {
    const validation = TeamCitySchema.safeParse(input)

    if (!validation.success) {
      return Err(
        ValidationError.fromZodError({
          error: validation.error,
        }),
      )
    }

    return Ok(new TeamCity(validation.data))
  }

  getValue(): TeamCityInput {
    return { name: this.name }
  }
}
