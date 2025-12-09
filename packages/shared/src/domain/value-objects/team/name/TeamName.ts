import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamNameInput, TeamNameSchema } from './TeamName.schema.js'
import type { TeamNameProps } from './TeamName.types.js'

export class TeamName {
  readonly name: string

  private constructor(props: TeamNameProps) {
    this.name = props.name
  }

  static create(input: TeamNameInput): Result<TeamName, ValidationError> {
    const validation = TeamNameSchema.safeParse(input)

    if (!validation.success) {
      return Err(ValidationError.fromZodError({ error: validation.error }))
    }

    return Ok(new TeamName(validation.data))
  }

  getValue(): TeamNameProps {
    return {
      name: this.name,
    }
  }
}
