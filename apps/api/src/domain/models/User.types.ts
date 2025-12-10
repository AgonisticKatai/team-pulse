import type { UserEmail, UserId, UserRole } from '@team-pulse/shared'

/**
 * Base User properties with Value Objects
 * This is the single source of truth for User shape
 */
export interface UserProps {
  id: UserId
  email: UserEmail
  passwordHash: string
  role: UserRole
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
  passwordHash: string
  role: string
}

/**
 * User creation data - uses primitives with optional dates
 */
export type CreateUserData = UserPrimitiveFields & {
  createdAt?: Date
  updatedAt?: Date
}

/**
 * User update data - partial primitives (excluding id)
 */
export type UpdateUserData = Partial<Omit<UserPrimitiveFields, 'id'>>

/**
 * User serialized data - primitives with Date objects (for internal use)
 * DOES NOT include passwordHash for security
 */
export type UserData = Omit<UserPrimitiveFields, 'passwordHash'> & {
  createdAt: Date
  updatedAt: Date
}
