import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type TeamNameInput, TeamNameSchema } from './TeamName.schema.js'
import type { TeamNameType } from './TeamName.types.js'

export class TeamName {
  private readonly value: TeamNameType

  private constructor({ value }: { value: TeamNameType }) {
    this.value = value
  }

  static create({ value }: { value: TeamNameInput }): Result<TeamName, ValidationError> {
    const result = TeamNameSchema.safeParse(value)

    if (!result.success) {
      return Err(ValidationError.fromZodError({ error: result.error }))
    }

    return Ok(new TeamName({ value: result.data }))
  }

  getValue(): TeamNameType {
    return this.value
  }
}
