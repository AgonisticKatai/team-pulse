import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import { Email } from '../value-objects'

/**
 * Password validation result
 */
interface PasswordValidation {
  errors: string[]
  isValid: boolean
}

/**
 * Auth Service Constants
 */
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 100

/**
 * Validate password strength
 * Returns list of validation errors (empty array if valid)
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  // Check empty
  if (!password || password.length === 0) {
    errors.push('Password is required')
    return { errors, isValid: false }
  }

  // Check min length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`)
  }

  // Check max length
  if (password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`)
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    errors,
    isValid: errors.length === 0,
  }
}

/**
 * Validate login credentials
 * Returns [error, null] or [null, { email, password }]
 */
export function validateLoginCredentials(
  email: string,
  password: string,
): Result<{ email: Email; password: string }, ValidationError> {
  // Validate email
  const [emailError, validEmail] = Email.create(email)
  if (emailError) return Err(emailError)

  // Validate password is not empty (server will check the actual password)
  if (!password || password.trim().length === 0) {
    return Err(ValidationError.forField('password', 'Password is required'))
  }

  return Ok({ email: validEmail, password })
}

/**
 * Validate registration credentials
 * Returns [error, null] or [null, { email, password }]
 */
export function validateRegistrationCredentials(
  email: string,
  password: string,
): Result<{ email: Email; password: string }, ValidationError> {
  // Validate email
  const [emailError, validEmail] = Email.create(email)
  if (emailError) return Err(emailError)

  // Validate password strength
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return Err(
      ValidationError.withDetails('Password validation failed', {
        errors: passwordValidation.errors,
      }),
    )
  }

  return Ok({ email: validEmail, password })
}

/**
 * Check if token is expired based on JWT payload
 * Note: This is a simplified check. In production, you'd decode the JWT
 */
export function isTokenExpired(token: string): boolean {
  try {
    // Split JWT token
    const parts = token.split('.')
    if (parts.length !== 3) {
      return true
    }

    // Decode payload (base64)
    const part = parts[1]
    if (!part) {
      return true
    }
    const decoded = atob(part)
    const payload = JSON.parse(decoded)

    // Check expiration
    if (!payload.exp) {
      return true
    }

    // Compare expiration with current time (exp is in seconds)
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= expirationTime
  } catch {
    // If we can't decode, consider it expired
    return true
  }
}

/**
 * Get token expiration time in milliseconds
 * Returns null if token is invalid or doesn't have exp claim
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const part = parts[1]
    if (!part) {
      return null
    }
    const decoded = atob(part)
    const payload = JSON.parse(decoded)

    if (!payload.exp) {
      return null
    }

    return payload.exp * 1000 // Convert to milliseconds
  } catch {
    return null
  }
}

/**
 * Calculate time until token expiration in milliseconds
 * Returns null if token is invalid or already expired
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expiration = getTokenExpiration(token)
  if (!expiration) {
    return null
  }

  const timeUntil = expiration - Date.now()
  return timeUntil > 0 ? timeUntil : null
}

/**
 * Check if token should be refreshed
 * Returns true if token expires in less than 2 minutes
 */
export function shouldRefreshToken(token: string): boolean {
  const timeUntilExpiration = getTimeUntilExpiration(token)
  if (!timeUntilExpiration) {
    return true // Token is expired or invalid
  }

  // Refresh if less than 2 minutes remaining
  const twoMinutesInMs = 2 * 60 * 1000
  return timeUntilExpiration < twoMinutesInMs
}
