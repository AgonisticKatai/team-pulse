import type { TeamResponseDTO } from '@team-pulse/shared'
import type { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import { City, EntityId, FoundedYear, TeamName } from '../value-objects'
import type {
  CreateTeamData,
  TeamConstructorProps,
  TeamData,
  TeamProps,
  TeamUpdateData,
} from './Team.types'

// Re-export public types
export type { CreateTeamData, TeamData, TeamProps, TeamUpdateData }

/**
 * Team Entity
 * Rich domain model with business logic
 */
export class Team {
  private readonly id: EntityId
  private readonly name: TeamName
  private readonly city: City
  private readonly foundedYear: FoundedYear | null
  private readonly createdAt: Date
  private readonly updatedAt: Date

  private constructor(props: TeamConstructorProps) {
    this.id = props.id
    this.name = props.name
    this.city = props.city
    this.foundedYear = props.foundedYear
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  /**
   * Factory method to create a Team from domain primitives
   * Returns [error, null] or [null, team]
   */
  static create(data: CreateTeamData): Result<Team, ValidationError> {
    // Validate and create EntityId
    const [idError, entityId] = EntityId.create(data.id)
    if (idError) return Err(idError)

    // Validate and create TeamName
    const [nameError, name] = TeamName.create(data.name)
    if (nameError) return Err(nameError)

    // Validate and create City
    const [cityError, city] = City.create(data.city)
    if (cityError) return Err(cityError)

    // Validate and create FoundedYear (optional)
    const [yearError, foundedYear] = FoundedYear.create(data.foundedYear)
    if (yearError) return Err(yearError)

    // Handle dates
    const createdAt =
      data.createdAt instanceof Date
        ? data.createdAt
        : data.createdAt
          ? new Date(data.createdAt)
          : new Date()

    const updatedAt =
      data.updatedAt instanceof Date
        ? data.updatedAt
        : data.updatedAt
          ? new Date(data.updatedAt)
          : new Date()

    return Ok(
      new Team({
        city,
        createdAt,
        foundedYear,
        id: entityId,
        name,
        updatedAt,
      }),
    )
  }

  /**
   * Factory method to create a Team from Value Objects
   * No validation needed (Value Objects are already validated)
   */
  static fromValueObjects(props: TeamProps): Team {
    return new Team(props)
  }

  /**
   * Factory method to create a Team from DTO
   * Returns [error, null] or [null, team]
   */
  static fromDTO(dto: TeamResponseDTO): Result<Team, ValidationError> {
    return Team.create({
      city: dto.city,
      createdAt: dto.createdAt,
      foundedYear: dto.foundedYear,
      id: dto.id,
      name: dto.name,
      updatedAt: dto.updatedAt,
    })
  }

  /**
   * Factory method to create array of Teams from array of DTOs
   * Returns [error, null] or [null, teams[]]
   * If any DTO fails to map, returns error for the first failure
   */
  static fromDTOList(dtos: TeamResponseDTO[]): Result<Team[], ValidationError> {
    const teams: Team[] = []

    for (const dto of dtos) {
      const [error, team] = Team.fromDTO(dto)
      if (error) return Err(error)
      teams.push(team)
    }

    return Ok(teams)
  }

  /**
   * Create an empty list of teams (for initial state)
   */
  static emptyList(): Team[] {
    return []
  }

  // Getters

  getId(): EntityId {
    return this.id
  }

  getName(): TeamName {
    return this.name
  }

  getCity(): City {
    return this.city
  }

  getFoundedYear(): FoundedYear | null {
    return this.foundedYear
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Business logic methods

  /**
   * Get team age (years since founding)
   * Returns null if founded year is not set
   */
  getAge(): number | null {
    return this.foundedYear ? this.foundedYear.getAge() : null
  }

  /**
   * Check if team was founded before a specific year
   */
  wasFoundedBefore(year: number): boolean {
    return this.foundedYear ? this.foundedYear.isBefore(year) : false
  }

  /**
   * Check if team was founded after a specific year
   */
  wasFoundedAfter(year: number): boolean {
    return this.foundedYear ? this.foundedYear.isAfter(year) : false
  }

  /**
   * Check if team has founding year information
   */
  hasFoundedYear(): boolean {
    return this.foundedYear !== null
  }

  /**
   * Update team with new data
   * Returns new Team instance (immutability)
   */
  update(data: TeamUpdateData): Result<Team, ValidationError> {
    // Use current values as defaults
    let name = this.name
    let city = this.city
    let foundedYear = this.foundedYear

    // Validate and update name if provided
    if (data.name !== undefined) {
      const [nameError, newName] = TeamName.create(data.name)
      if (nameError) return Err(nameError)
      name = newName
    }

    // Validate and update city if provided
    if (data.city !== undefined) {
      const [cityError, newCity] = City.create(data.city)
      if (cityError) return Err(cityError)
      city = newCity
    }

    // Validate and update founded year if provided
    if (data.foundedYear !== undefined) {
      const [yearError, newYear] = FoundedYear.create(data.foundedYear)
      if (yearError) return Err(yearError)
      foundedYear = newYear
    }

    // Create new Team instance with updated values
    return Ok(
      new Team({
        city,
        createdAt: this.createdAt,
        foundedYear,
        id: this.id,
        name,
        updatedAt: new Date(),
      }),
    )
  }

  /**
   * Check equality with another Team
   */
  equals(other: Team): boolean {
    return this.id.equals(other.id)
  }

  /**
   * Convert to plain object (for serialization)
   */
  toObject(): {
    city: string
    createdAt: string
    foundedYear: number | null
    id: string
    name: string
    updatedAt: string
  } {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt.toISOString(),
      foundedYear: this.foundedYear ? this.foundedYear.getValue() : null,
      id: this.id.getValue(),
      name: this.name.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  /**
   * Convert to DTO (for API communication)
   */
  toDTO(): TeamResponseDTO {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt.toISOString(),
      foundedYear: this.foundedYear ? this.foundedYear.getValue() : null,
      id: this.id.getValue(),
      name: this.name.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  /**
   * JSON serialization
   */
  toJSON() {
    return this.toObject()
  }
}
