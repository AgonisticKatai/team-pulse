import type { City, EntityId, FoundedYear, TeamName } from '../value-objects'

/**
 * Base Team properties with Value Objects
 * This is the single source of truth for Team shape
 */
export interface TeamProps {
  id: EntityId
  name: TeamName
  city: City
  foundedYear: FoundedYear | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Team constructor properties
 * Same as TeamProps - constructor receives validated Value Objects
 */
export type TeamConstructorProps = TeamProps

/**
 * Team primitive domain fields
 * Reused across multiple type definitions
 */
interface TeamPrimitiveFields {
  id: string
  name: string
  city: string
  foundedYear: number | null
}

/**
 * Team creation data - uses primitives with optional dates and founded year
 */
export type CreateTeamData = Omit<TeamPrimitiveFields, 'foundedYear'> & {
  foundedYear?: number | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

/**
 * Team serialized data - primitives with ISO date strings
 * Used by toObject() and toJSON()
 */
export type TeamData = TeamPrimitiveFields & {
  createdAt: string
  updatedAt: string
}

/**
 * Team update data - partial primitives for update operations
 * Only allows updating domain fields (not id or timestamps)
 */
export type TeamUpdateData = Partial<Pick<TeamPrimitiveFields, 'name' | 'city' | 'foundedYear'>>
