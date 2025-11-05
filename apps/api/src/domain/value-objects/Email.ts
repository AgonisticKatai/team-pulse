import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * Email Value Object
 * Immutable and self-validating
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static readonly MAX_LENGTH = 255

  private readonly value: string

  private constructor({ value }: { value: string }) {
    this.value = value
  }

  /**
   * Validate if email is not empty
   */
  private static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'email', message: 'Email address is required' }))
    }
    return Ok(value.trim().toLowerCase())
  }

  /**
   * Validate email format
   */
  private static validateFormat({ value }: { value: string }): Result<string, ValidationError> {
    if (!Email.EMAIL_REGEX.test(value)) {
      return Err(
        ValidationError.forField({ field: 'email', message: 'Email address format is invalid' }),
      )
    }
    return Ok(value)
  }

  /**
   * Validate email length
   */
  private static validateLength({ value }: { value: string }): Result<string, ValidationError> {
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
   * Returns [error, null] or [null, email]
   */
  static create({ value }: { value: string }): Result<Email, ValidationError> {
    // Validate not empty
    const [errorNotEmpty, trimmedValue] = Email.validateNotEmpty({ value })
    if (errorNotEmpty) {
      return Err(errorNotEmpty)
    }

    // Validate format
    const [errorFormat] = Email.validateFormat({ value: trimmedValue! })
    if (errorFormat) {
      return Err(errorFormat)
    }

    // Validate length
    const [errorLength] = Email.validateLength({ value: trimmedValue! })
    if (errorLength) {
      return Err(errorLength)
    }

    return Ok(new Email({ value: trimmedValue! }))
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
