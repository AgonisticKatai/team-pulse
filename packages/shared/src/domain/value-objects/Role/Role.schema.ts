import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants'
import { z } from 'zod'
import { UserRoles } from './Role.constants.js'
import type { UserRoleType } from './Role.types.js'

const roleValues = Object.values(UserRoles) as [UserRoleType, ...UserRoleType[]]

export const roleSchema = z.enum(roleValues, { message: VALIDATION_MESSAGES.SPECIFIC.ROLE.INVALID_OPTION })
