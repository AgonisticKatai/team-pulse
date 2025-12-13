import { UserEmailSchema } from '@value-objects/user'
import { z } from 'zod'
import { UserResponseSchema } from './user.dto.js'

const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

// --- REQUESTS ---
export const LoginSchema = z
  .object({
    email: UserEmailSchema,
    password: z.string().min(1),
  })
  .strict()

export type LoginDTO = z.infer<typeof LoginSchema>

export const RefreshTokenSchema = TokensSchema.pick({ refreshToken: true }).strict()
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>

// --- RESPONSES ---
export const LoginResponseSchema = TokensSchema.extend({
  user: UserResponseSchema,
})

export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>

export const RefreshTokenResponseSchema = TokensSchema.pick({ accessToken: true })
export type RefreshTokenResponseDTO = z.infer<typeof RefreshTokenResponseSchema>
