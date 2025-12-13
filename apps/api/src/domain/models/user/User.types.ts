import type { UserEmail, UserId, UserRole } from '@team-pulse/shared'

export interface UserCreateInput {
  id: string
  email: string
  passwordHash: string
  role: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserProps {
  id: UserId
  email: UserEmail
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserConstructorProps = UserProps

interface UserPrimitiveFields {
  id: string
  email: string
  passwordHash: string
  role: string
}

export type CreateUserData = UserPrimitiveFields & {
  createdAt?: Date
  updatedAt?: Date
}

export type UpdateUserData = Partial<Omit<UserPrimitiveFields, 'id'>>

export type UserData = Omit<UserPrimitiveFields, 'passwordHash'> & {
  createdAt: Date
  updatedAt: Date
}
