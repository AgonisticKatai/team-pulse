import { ValidationError } from '@team-pulse/shared/errors'
import type { Result } from '@team-pulse/shared/result'
import { Err, Ok } from '@team-pulse/shared/result'

/**
 * Email Value Object
 * Immutable and self-validating
 */
export class Email {
  protected static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  protected static readonly MAX_LENGTH = 255

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if email is not empty
   */
  protected static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address is required' }))
    }
    return Ok(value.trim().toLowerCase())
  }

  /**
   * Validate email format
   */
  protected static validateFormat({ value }: { value: string }): Result<string, ValidationError> {
    if (!Email.EMAIL_REGEX.test(value)) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address format is invalid' }))
    }
    return Ok(value)
  }

  /**
   * Validate email length
   */
  protected static validateLength({ value }: { value: string }): Result<string, ValidationError> {
    if (value.length > Email.MAX_LENGTH) {
      return Err(
        ValidationError.forField({
          field: 'email',
          message: 'Email address must not exceed 255 characters',
        }),
      )
    }
    return Ok(value)
  }

  /**
   * Factory method to create an Email (creational pattern)
   */
  static create({ value }: { value: string }): Result<Email, ValidationError> {
    // Validate not empty
    const notEmptyResult = Email.validateNotEmpty({ value })
    if (!notEmptyResult.ok) {
      return Err(notEmptyResult.error)
    }

    // Validate format
    const formatResult = Email.validateFormat({ value: notEmptyResult.value })
    if (!formatResult.ok) {
      return Err(formatResult.error)
    }

    // Validate length
    const lengthResult = Email.validateLength({ value: formatResult.value })
    if (!lengthResult.ok) {
      return Err(lengthResult.error)
    }

    return Ok(new Email({ value: lengthResult.value }))
  }

  /**
   * Get the email value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Get the domain part of the email
   */
  getDomain(): string {
    return this.value.split('@')[1] ?? ''
  }

  /**
   * Get the local part of the email
   */
  getLocalPart(): string {
    return this.value.split('@')[0] ?? ''
  }

  /**
   * Check equality with another Email
   */
  equals({ other }: { other: Email }): boolean {
    return this.value === other.value
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value
  }
}
