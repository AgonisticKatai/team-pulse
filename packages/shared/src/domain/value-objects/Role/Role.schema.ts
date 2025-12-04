import { z } from 'zod'
import { UserRoles, type UserRoleType } from './Role.types'

const roleValues = Object.values(UserRoles) as [UserRoleType, ...UserRoleType[]]

export const roleSchema = z.enum(roleValues)
