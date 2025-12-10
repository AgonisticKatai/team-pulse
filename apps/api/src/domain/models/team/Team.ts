import type { TeamCreateInput, TeamPrimitives, TeamProps, TeamUpdateInput } from '@domain/models/team/Team.types.js'
import type { Result, ValidationError } from '@team-pulse/shared'
import { combine, Err, merge, Ok, TeamCity, TeamFoundedYear, TeamId, TeamName } from '@team-pulse/shared'

export class Team {
  readonly id: TeamId
  readonly name: TeamName
  readonly city: TeamCity
  readonly foundedYear: TeamFoundedYear
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: TeamProps) {
    this.id = props.id
    this.name = props.name
    this.city = props.city
    this.foundedYear = props.foundedYear
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: TeamCreateInput): Result<Team, ValidationError> {
    const results = combine({
      city: TeamCity.create({ name: input.city }),
      foundedYear: TeamFoundedYear.createOptional({ year: input.foundedYear }),
      id: TeamId.create({ id: input.id }),
      name: TeamName.create({ name: input.name }),
    })

    if (!results.ok) {
      return Err(results.error)
    }

    return Ok(
      new Team({
        city: results.value.city,
        createdAt: input.createdAt ?? new Date(),
        foundedYear: results.value.foundedYear,
        id: results.value.id,
        name: results.value.name,
        updatedAt: input.updatedAt ?? new Date(),
      }),
    )
  }

  update(data: TeamUpdateInput): Result<Team, ValidationError> {
    const updatedProps = merge({ current: this.toPrimitives(), update: data })

    return Team.create({ ...updatedProps, createdAt: this.createdAt, id: this.id, updatedAt: new Date() })
  }

  toPrimitives(): TeamPrimitives {
    return {
      city: this.city.name,
      createdAt: this.createdAt,
      foundedYear: this.foundedYear?.year ?? null,
      id: this.id,
      name: this.name.name,
      updatedAt: this.updatedAt,
    }
  }
}
