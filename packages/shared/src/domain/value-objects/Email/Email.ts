import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { emailSchema } from './Email.schema'
import type { EmailType } from './Email.types'

/**
 * Email Value Object
 *
 * Represents an email address with automatic normalization and validation.
 * The email is automatically trimmed and converted to lowercase.
 */
export class Email {
  private readonly value: EmailType

  private constructor({ value }: { value: EmailType }) {
    this.value = value
  }

  static create({ value }: { value: string }): Result<Email, ValidationError> {
    const validationResult = Email.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'email',
          message: validationResult.error.message,
          value,
        }),
      )
    }

    return Ok(new Email({ value: validationResult.value }))
  }

  static validate({ value }: { value: string }): Result<EmailType, ValidationError> {
    const result = emailSchema.safeParse(value)

    if (!result.success) {
      return Err(ValidationError.fromZodError({ error: result.error }))
    }

    return Ok(result.data)
  }

  static isValid({ value }: { value: string }): boolean {
    return emailSchema.safeParse(value).success
  }

  getValue(): EmailType {
    return this.value
  }

  equals({ other }: { other: Email }): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
