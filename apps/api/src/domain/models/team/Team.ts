import type { TeamCreateInput, TeamPrimitives, TeamProps, TeamUpdateInput } from '@domain/models/team/Team.types.js'
import type { Result } from '@team-pulse/shared'
import { Err, IdUtils, Ok, TeamCity, TeamFoundedYear, type TeamId, TeamName, ValidationError } from '@team-pulse/shared'

export class Team {
  readonly id: TeamId
  readonly name: TeamName
  readonly city: TeamCity
  readonly foundedYear: TeamFoundedYear | null
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
    if (!IdUtils.isValid(input.id)) {
      return Err(
        ValidationError.create({
          message: 'Invalid Team ID format',
          metadata: { field: 'id', value: input.id },
        }),
      )
    }

    const nameResult = TeamName.create({ name: input.name })
    if (!nameResult.ok) return Err(nameResult.error)

    const cityResult = TeamCity.create({ name: input.city })
    if (!cityResult.ok) return Err(cityResult.error)

    let foundedYearVO: TeamFoundedYear | null = null
    if (input.foundedYear !== undefined && input.foundedYear !== null) {
      const yearResult = TeamFoundedYear.create({ year: input.foundedYear })
      if (!yearResult.ok) return Err(yearResult.error)
      foundedYearVO = yearResult.value
    }

    return Ok(
      new Team({
        city: cityResult.value,
        createdAt: input.createdAt ?? new Date(),
        foundedYear: foundedYearVO,
        id: IdUtils.toId<TeamId>(input.id),
        name: nameResult.value,
        updatedAt: input.updatedAt ?? new Date(),
      }),
    )
  }

  static fromProps(props: TeamProps): Team {
    return new Team(props)
  }

  update(data: TeamUpdateInput): Result<Team, ValidationError> {
    return Team.create({
      city: data.city ?? this.city.name,
      createdAt: this.createdAt,
      foundedYear: data.foundedYear === undefined ? (this.foundedYear?.year ?? null) : data.foundedYear,
      id: this.id,
      name: data.name ?? this.name.name,
      updatedAt: new Date(),
    })
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
