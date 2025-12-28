import type { UserEmail, UserEmailInput, UserId, UserRole, UserRoleInput, UserRoleType } from '@team-pulse/shared'

export type UserCreateInput = {
  id: string
  email: UserEmailInput
  passwordHash: string
  role: UserRoleInput
  createdAt?: Date
  updatedAt?: Date
}

export type UserUpdateInput = {
  email?: UserEmailInput
  passwordHash?: string
  role?: UserRoleInput
}

export type UserProps = {
  id: UserId
  email: UserEmail
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserPrimitives = {
  id: string
  email: string
  role: UserRoleType
  createdAt: Date
  updatedAt: Date
}
