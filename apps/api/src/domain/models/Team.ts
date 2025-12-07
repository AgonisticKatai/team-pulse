import type { TeamFactoryInput, TeamUpdateInput, TeamValueObjects } from '@domain/models/Team.types.js'
import { City } from '@domain/value-objects/City.js'
import { FoundedYear } from '@domain/value-objects/FoundedYear.js'
import { TeamName } from '@domain/value-objects/TeamName.js'
import { IdUtils, type TeamId } from '@team-pulse/shared/domain/ids'
import type { TeamResponseDTO } from '@team-pulse/shared/dtos'
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

// Re-export public types
export type { TeamFactoryInput, TeamUpdateInput, TeamValueObjects }

export class Team {
  readonly id: TeamId
  readonly name: TeamName
  readonly city: City
  readonly foundedYear: FoundedYear | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor({ id, name, city, foundedYear, createdAt, updatedAt }: TeamValueObjects) {
    this.id = id
    this.name = name
    this.city = city
    this.foundedYear = foundedYear
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Helper internal to validate optional VOs
   */
  protected static validateOptionalFoundedYear({
    foundedYear,
  }: {
    foundedYear: number | null | undefined
  }): Result<FoundedYear | null, ValidationError> {
    if (foundedYear === null || foundedYear === undefined) {
      return Ok(null)
    }

    const result = FoundedYear.create({ value: foundedYear })
    if (!result.ok) {
      return Err(result.error)
    }

    return Ok(result.value)
  }

  /**
   * Factory method to create a new Team from primitives
   */
  static create(data: TeamFactoryInput): Result<Team, ValidationError> {
    // 1. ID Validation
    if (!IdUtils.isValid(data.id)) {
      return Err(
        ValidationError.create({
          message: 'Invalid Team ID format',
          metadata: { field: 'id', value: data.id },
        }),
      )
    }
    // 2. Name Validation
    const nameResult = TeamName.create({ value: data.name })
    if (!nameResult.ok) return Err(nameResult.error)

    // 3. City Validation
    const cityResult = City.create({ value: data.city })
    if (!cityResult.ok) return Err(cityResult.error)

    // 4. foundedYear Validation
    const foundedYearResult = Team.validateOptionalFoundedYear({
      foundedYear: data.foundedYear,
    })
    if (!foundedYearResult.ok) return Err(foundedYearResult.error)

    return Ok(
      new Team({
        city: cityResult.value,
        createdAt: data.createdAt ?? new Date(),
        foundedYear: foundedYearResult.value,
        id: IdUtils.toId<TeamId>(data.id),
        name: nameResult.value,
        updatedAt: data.updatedAt ?? new Date(),
      }),
    )
  }

  /**
   * Factory method from existing VOs (Hydration / Internal use)
   */
  static fromValueObjects(props: TeamValueObjects): Team {
    return new Team(props)
  }

  /**
   * Update team information (Immutability Pattern)
   */
  update(data: TeamUpdateInput): Result<Team, ValidationError> {
    return Team.create({
      city: data.city ?? this.city.getValue(),
      createdAt: this.createdAt,
      foundedYear: data.foundedYear === undefined ? (this.foundedYear?.getValue() ?? null) : data.foundedYear,
      id: this.id,
      name: data.name ?? this.name.getValue(),
      updatedAt: new Date(),
    })
  }

  /**
   * Convert to plain object
   */
  toObject() {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt,
      foundedYear: this.foundedYear?.getValue() ?? null,
      id: this.id,
      name: this.name.getValue(),
      updatedAt: this.updatedAt,
    }
  }

  /**
   * Convert to DTO
   */
  toDTO(): TeamResponseDTO {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt.toISOString(),
      foundedYear: this.foundedYear?.getValue() ?? null,
      id: this.id,
      name: this.name.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}
