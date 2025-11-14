import bcrypt from 'bcryptjs'
import { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.js'
import { Err, Ok, type Result } from '../../domain/types/Result.js'

/**
 * Bcrypt Password Hasher Implementation (INFRASTRUCTURE ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the IPasswordHasher domain service interface
 * - Uses bcrypt library for password hashing
 * - Lives in infrastructure layer
 *
 * Why bcrypt?
 * - Slow hashing algorithm designed for passwords
 * - Resistant to brute-force attacks
 * - Industry standard for password hashing
 * - Includes built-in salting
 *
 * Alternative implementations could use:
 * - Argon2 (more modern, winner of Password Hashing Competition)
 * - PBKDF2
 * - scrypt
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * Number of salt rounds for bcrypt
   * Higher = more secure but slower
   * 10 rounds is a good balance for production
   */
  private readonly saltRounds: number

  private constructor({ saltRounds = 10 }: { saltRounds?: number } = {}) {
    this.saltRounds = saltRounds
  }

  static create({ saltRounds = 10 }: { saltRounds?: number } = {}): BcryptPasswordHasher {
    return new BcryptPasswordHasher({ saltRounds })
  }

  /**
   * Hash a plain text password using bcrypt
   *
   * Returns Result to handle potential hashing failures gracefully
   */
  async hash({ password }: { password: string }): Promise<Result<string, RepositoryError>> {
    try {
      const hash = await bcrypt.hash(password, this.saltRounds)
      return Ok(hash)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : undefined,
          message: 'Failed to hash password',
          operation: 'hash',
        }),
      )
    }
  }

  /**
   * Verify a plain text password against a bcrypt hash
   *
   * Returns Result to handle potential verification failures gracefully
   */
  async verify({ password, hash }: { password: string; hash: string }): Promise<Result<boolean, RepositoryError>> {
    try {
      const isValid = await bcrypt.compare(password, hash)
      return Ok(isValid)
    } catch (error) {
      return Err(
        RepositoryError.forOperation({
          cause: error instanceof Error ? error : undefined,
          message: 'Failed to verify password',
          operation: 'verify',
        }),
      )
    }
  }
}
