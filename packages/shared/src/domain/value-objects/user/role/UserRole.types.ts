import type { USER_ROLES } from './UserRole.constants.js'

export type UserRoleName = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export type UserRoleProps = {
  name: UserRoleName
}
