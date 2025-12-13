import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type UserEmailInput, UserEmailSchema } from './UserEmail.schema.js'
import type { UserEmailProps } from './UserEmail.types.js'

export class UserEmail {
  readonly value: string

  private constructor(value: UserEmailProps) {
    this.value = value
  }

  static create(input: UserEmailInput): Result<UserEmail, ValidationError> {
    const validation = UserEmailSchema.safeParse(input)

    if (!validation.success) {
      return Err(
        ValidationError.fromZodError({
          error: validation.error,
        }),
      )
    }

    return Ok(new UserEmail(validation.data))
  }

  getValue(): UserEmailProps {
    return this.value
  }
}
