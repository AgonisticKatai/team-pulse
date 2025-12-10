import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamNameInput, TeamNameSchema } from './TeamName.schema.js'
import type { TeamNameProps } from './TeamName.types.js'

export class TeamName {
  readonly value: string

  private constructor(value: TeamNameProps) {
    this.value = value
  }

  static create(input: TeamNameInput): Result<TeamName, ValidationError> {
    const validation = TeamNameSchema.safeParse(input)

    if (!validation.success) {
      return Err(ValidationError.fromZodError({ error: validation.error }))
    }

    return Ok(new TeamName(validation.data))
  }

  getValue(): TeamNameProps {
    return this.value
  }
}
