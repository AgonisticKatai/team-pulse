import { UserEmailSchema, UserRoleSchema } from '@value-objects/user'
import { z } from 'zod'
import { EntityIdSchema, TimestampsSchema } from './entity-base.dto'
import { createPaginatedResponseSchema } from './pagination.dto'

// 1. CORE
const UserCore = z.object({ email: UserEmailSchema, role: UserRoleSchema })

// 2. INPUTS
export const CreateUserSchema = UserCore.extend({
  password: z.string().min(6), // Basic validation for raw password
}).strict()
export type CreateUserDTO = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = UserCore.partial().strict()
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>

// 3. OUTPUTS
export const UserResponseSchema = EntityIdSchema.merge(UserCore).merge(TimestampsSchema)
export type UserResponseDTO = z.infer<typeof UserResponseSchema>

// 4. LIST RESPONSE
export const UsersListResponseSchema = createPaginatedResponseSchema(UserResponseSchema)
export type UsersListResponseDTO = z.infer<typeof UsersListResponseSchema>
