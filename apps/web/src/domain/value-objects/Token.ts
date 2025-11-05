import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * Token Value Object for JWT tokens
 * Represents an immutable JWT token with validation
 */
export class Token {
  private constructor(private readonly value: string) {}

  /**
   * Validate token value
   * Returns error if validation fails, null if valid
   */
  private static validate({ value }: { value: string }): ValidationError | null {
    if (!value || value.trim().length === 0) {
      return ValidationError.forField('token', 'Token is required')
    }

    const trimmedValue = value.trim()

    // Basic JWT format validation (3 parts separated by dots)
    const parts = trimmedValue.split('.')
    if (parts.length !== 3) {
      return ValidationError.forField('token', 'Invalid token format')
    }

    return null
  }

  /**
   * Factory method to create a Token
   * Returns [error, null] or [null, token]
   */
  static create({ value }: { value: string }): Result<Token, ValidationError> {
    const error = Token.validate({ value })
    if (error) {
      return Err(error)
    }

    const trimmedValue = value.trim()
    return Ok(new Token(trimmedValue))
  }

  /**
   * Get the token string value
   */
  getValue(): string {
    return this.value
  }

  /**
   * Check equality with another token
   */
  equals(other: Token): boolean {
    return this.value === other.value
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this.value
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): string {
    return this.value
  }
}
