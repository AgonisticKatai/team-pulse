import type { USER_ROLES } from './UserRole.constants.js'

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES]
