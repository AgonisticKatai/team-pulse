import { z } from 'zod'
import { USER_ROLE_VALIDATION_MESSAGES, USER_ROLES } from './UserRole.constants.js'
import type { UserRoleType } from './UserRole.types.js'

const userRoleValues = Object.values(USER_ROLES) as [UserRoleType, ...UserRoleType[]]

export const UserRoleSchema = z.enum(userRoleValues, { message: USER_ROLE_VALIDATION_MESSAGES.INVALID_OPTION })
