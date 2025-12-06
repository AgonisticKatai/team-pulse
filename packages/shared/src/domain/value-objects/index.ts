/**
 * Domain Value Objects
 *
 * Centralized exports for all Value Objects in the domain layer.
 */

export type { EmailType } from './Email/index.js'
export { Email, emailSchema } from './Email/index.js'

export type { UserRoleType } from './Role/index.js'
export { Role, roleSchema, UserRoles } from './Role/index.js'
