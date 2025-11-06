import type { City, EntityId, FoundedYear, TeamName } from '../value-objects/index.js'

/**
 * Team Factory Input
 *
 * Data structure for creating a Team with primitive values.
 * The factory method will convert these to value objects.
 */
export interface TeamFactoryInput {
  id: string
  name: string
  city: string
  foundedYear?: number | null
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Team Value Objects
 *
 * Validated value objects that compose the Team entity.
 * Used by fromValueObjects() to create entities without re-validation.
 */
export interface TeamValueObjects {
  id: EntityId
  name: TeamName
  city: City
  foundedYear: FoundedYear | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Team Update Input
 *
 * Partial data for updating a Team entity.
 */
export interface TeamUpdateInput {
  name?: string
  city?: string
  foundedYear?: number | null
}
