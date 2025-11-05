import type { Email, EntityId, Role } from '../value-objects'

/**
 * Base User properties with Value Objects
 * This is the single source of truth for User shape
 */
export interface UserProps {
  id: EntityId
  email: Email
  role: Role
  createdAt: Date
  updatedAt: Date
}

/**
 * User constructor properties
 * Same as UserProps - constructor receives validated Value Objects
 */
export type UserConstructorProps = UserProps

/**
 * User primitive domain fields
 * Reused across multiple type definitions
 */
interface UserPrimitiveFields {
  id: string
  email: string
  role: string
}

/**
 * User creation data - uses primitives with optional dates
 */
export type CreateUserData = UserPrimitiveFields & {
  createdAt?: Date | string
  updatedAt?: Date | string
}

/**
 * User serialized data - primitives with ISO date strings
 * Used by toObject() and toJSON()
 */
export type UserData = UserPrimitiveFields & {
  createdAt: string
  updatedAt: string
}
