import { ValidationError } from '../errors/index.js'

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
 */
export class Team {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly city: string,
    public readonly foundedYear: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    // Validate business invariants
    this.validateInvariants()
  }

  /**
   * Factory method to create a new Team
   *
   * Use this instead of constructor for new teams (not from DB)
   */
  static create(data: {
    id: string
    name: string
    city: string
    foundedYear?: number
  }): Team {
    return new Team(data.id, data.name, data.city, data.foundedYear ?? null, new Date(), new Date())
  }

  /**
   * Factory method to reconstitute a Team from persistence
   *
   * Use this when loading from database
   */
  static fromPersistence(data: {
    id: string
    name: string
    city: string
    foundedYear: number | null
    createdAt: Date
    updatedAt: Date
  }): Team {
    return new Team(data.id, data.name, data.city, data.foundedYear, data.createdAt, data.updatedAt)
  }

  /**
   * Validate business invariants
   *
   * These are the BUSINESS RULES that must always be true
   */
  private validateInvariants(): void {
    // Name must not be empty and must be reasonable length
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Team name cannot be empty', 'name')
    }

    if (this.name.length > 100) {
      throw new ValidationError('Team name cannot exceed 100 characters', 'name')
    }

    // City must not be empty
    if (!this.city || this.city.trim().length === 0) {
      throw new ValidationError('Team city cannot be empty', 'city')
    }

    if (this.city.length > 100) {
      throw new ValidationError('Team city cannot exceed 100 characters', 'city')
    }

    // Founded year validation (if provided)
    if (this.foundedYear !== null) {
      const currentYear = new Date().getFullYear()
      const minYear = 1800 // Football modern rules started ~1860s

      if (this.foundedYear < minYear || this.foundedYear > currentYear) {
        throw new ValidationError(
          `Team founded year must be between ${minYear} and ${currentYear}`,
          'foundedYear',
        )
      }
    }
  }

  /**
   * Update team information
   *
   * Returns a new Team instance (immutability)
   */
  update(data: { name?: string; city?: string; foundedYear?: number | null }): Team {
    return new Team(
      this.id,
      data.name ?? this.name,
      data.city ?? this.city,
      data.foundedYear === undefined ? this.foundedYear : data.foundedYear,
      this.createdAt,
      new Date(), // Update timestamp
    )
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
      id: this.id,
      name: this.name,
      city: this.city,
      foundedYear: this.foundedYear,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
