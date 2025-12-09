import { z } from 'zod'
import { USER_ROLE_VALIDATION_MESSAGES, USER_ROLES } from './UserRole.constants.js'
import type { UserRoleName } from './UserRole.types.js'

const userRoleValues = Object.values(USER_ROLES) as [UserRoleName, ...UserRoleName[]]

export const UserRoleSchema = z.object({
  name: z.enum(userRoleValues, { message: USER_ROLE_VALIDATION_MESSAGES.INVALID_OPTION }),
})

export type UserRoleInput = z.infer<typeof UserRoleSchema>
