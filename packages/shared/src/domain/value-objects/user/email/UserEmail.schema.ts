import { z } from 'zod'
import { USER_EMAIL_VALIDATION_MESSAGES } from './UserEmail.constants.js'
import { USER_EMAIL_RULES } from './UserEmail.rules.js'

export const UserEmailAddressSchema = z
  .string({ message: USER_EMAIL_VALIDATION_MESSAGES.INVALID_FORMAT })
  .trim()
  .toLowerCase()
  .min(USER_EMAIL_RULES.MIN_LENGTH, { message: USER_EMAIL_VALIDATION_MESSAGES.TOO_SHORT })
  .max(USER_EMAIL_RULES.MAX_LENGTH, { message: USER_EMAIL_VALIDATION_MESSAGES.TOO_LONG })
  .pipe(z.email({ message: USER_EMAIL_VALIDATION_MESSAGES.INVALID_FORMAT }))

export const UserEmailSchema = z.object({ address: UserEmailAddressSchema })

export type UserEmailInput = z.infer<typeof UserEmailSchema>
