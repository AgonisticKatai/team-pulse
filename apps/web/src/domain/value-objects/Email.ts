import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * Email Value Object
 * Immutable and self-validating
 */
export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(private readonly value: string) {}

  /**
   * Factory method to create an Email (creational pattern)
   * Returns [error, null] or [null, email]
   */
  static create(value: string): Result<Email, ValidationError> {
    // Handle empty/null case
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('email', 'Email address is required'))
    }

    const trimmedValue = value.trim().toLowerCase()

    // Validate format
    if (!Email.EMAIL_REGEX.test(trimmedValue)) {
      return Err(ValidationError.forField('email', 'Email address format is invalid'))
    }

    // Validate length
    if (trimmedValue.length > 255) {
      return Err(ValidationError.forField('email', 'Email address must not exceed 255 characters'))
    }

    return Ok(new Email(trimmedValue))
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
  equals(other: Email): boolean {
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
