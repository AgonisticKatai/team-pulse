import type { UserId } from '../ids'
import type { EmailType, UserRoleType } from '../value-objects'

export interface UserProps {
  id: UserId
  email: EmailType
  role: UserRoleType
  createdAt: Date
  updatedAt: Date
}
