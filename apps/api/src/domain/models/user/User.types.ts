import type { UserEmail, UserEmailInput, UserId, UserRole, UserRoleInput, UserRoleType } from '@team-pulse/shared'

export interface UserCreateInput {
  id: string
  email: UserEmailInput
  passwordHash: string
  role: UserRoleInput
  createdAt?: Date
  updatedAt?: Date
}

export interface UserUpdateInput {
  email?: UserEmailInput
  passwordHash?: string
  role?: UserRoleInput
}

export interface UserProps {
  id: UserId
  email: UserEmail
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface UserPrimitives {
  id: string
  email: string
  role: UserRoleType
  createdAt: Date
  updatedAt: Date
}
