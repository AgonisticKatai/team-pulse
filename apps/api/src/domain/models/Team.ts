import type { TeamResponseDTO } from '@team-pulse/shared'
import { Err, Ok, type Result } from '@team-pulse/shared'
import type { ValidationError } from '../errors/index.js'
import { City, EntityId, FoundedYear, TeamName } from '../value-objects/index.js'
import type { TeamFactoryInput, TeamUpdateInput, TeamValueObjects } from './Team.types.js'

// Re-export public types
export type { TeamFactoryInput, TeamUpdateInput, TeamValueObjects }

/**
 * Team Domain Entity
 *
 * Represents a football team in the business domain.
 * This is a RICH DOMAIN MODEL - it encapsulates:
 * - Business data (name, city, etc.)
 * - Business rules (validation, invariants)
 * - Business behavior (methods for domain operations)
 *
 * This entity is FRAMEWORK-AGNOSTIC:
 * - No database dependencies
 * - No HTTP dependencies
 * - Pure TypeScript/JavaScript
 *
 * The infrastructure layer is responsible for persisting this entity.
 *
 * IMPORTANT: Follows the same pattern as User:
 * - Uses separate .types.ts file
 * - NO fromPersistence() method (use create() with timestamps)
 * - update() calls create() internally
 * - Self-contained DTO mapping
 */
export class Team {
  public readonly id: EntityId
  public readonly name: TeamName
  public readonly city: City
  public readonly foundedYear: FoundedYear | null
  public readonly createdAt: Date
  public readonly updatedAt: Date

  private constructor({ id, name, city, foundedYear, createdAt, updatedAt }: TeamValueObjects) {
    this.id = id
    this.name = name
    this.city = city
    this.foundedYear = foundedYear
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Validate optional foundedYear
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
   *
   * Use this for:
   * - Creating new teams
   * - Reconstituting from database (pass timestamps)
   * - Any scenario where you have primitive values
   *
   * Timestamps are optional - if not provided, will use new Date()
   */
  static create(data: TeamFactoryInput): Result<Team, ValidationError> {
    // Validate id
    const idResult = EntityId.create({ value: data.id })
    if (!idResult.ok) {
      return Err(idResult.error)
    }

    // Validate name
    const nameResult = TeamName.create({ value: data.name })
    if (!nameResult.ok) {
      return Err(nameResult.error)
    }

    // Validate city
    const cityResult = City.create({ value: data.city })
    if (!cityResult.ok) {
      return Err(cityResult.error)
    }

    // Validate foundedYear (optional)
    const foundedYearResult = Team.validateOptionalFoundedYear({
      foundedYear: data.foundedYear,
    })
    if (!foundedYearResult.ok) {
      return Err(foundedYearResult.error)
    }

    return Ok(
      new Team({
        city: cityResult.value,
        createdAt: data.createdAt ?? new Date(),
        foundedYear: foundedYearResult.value,
        id: idResult.value,
        name: nameResult.value,
        updatedAt: data.updatedAt ?? new Date(),
      }),
    )
  }

  /**
   * Factory method to create Team from validated Value Objects
   *
   * Use this when you already have validated Value Objects
   * and don't want to re-validate them.
   *
   * NO validation is performed (Value Objects are already validated)
   */
  static fromValueObjects(props: TeamValueObjects): Team {
    return new Team(props)
  }

  /**
   * Update team information
   *
   * Returns a new Team instance (immutability)
   * Internally calls create() to ensure validation
   */
  update(data: TeamUpdateInput): Result<Team, ValidationError> {
    return Team.create({
      city: data.city ?? this.city.getValue(),
      createdAt: this.createdAt,
      foundedYear: data.foundedYear === undefined ? (this.foundedYear?.getValue() ?? null) : data.foundedYear,
      id: this.id.getValue(),
      name: data.name ?? this.name.getValue(),
      updatedAt: new Date(),
    })
  }

  /**
   * Convert to plain object for serialization
   */
  toObject(): {
    id: string
    name: string
    city: string
    foundedYear: number | null
    createdAt: Date
    updatedAt: Date
  } {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt,
      foundedYear: this.foundedYear?.getValue() ?? null,
      id: this.id.getValue(),
      name: this.name.getValue(),
      updatedAt: this.updatedAt,
    }
  }

  /**
   * Convert to TeamResponseDTO (for API responses)
   *
   * Dates are converted to ISO strings for JSON serialization
   */
  toDTO(): TeamResponseDTO {
    return {
      city: this.city.getValue(),
      createdAt: this.createdAt.toISOString(),
      foundedYear: this.foundedYear?.getValue() ?? null,
      id: this.id.getValue(),
      name: this.name.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}
