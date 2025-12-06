import type { UserRoles } from './Role.constants.js'

export type UserRoleType = (typeof UserRoles)[keyof typeof UserRoles]
