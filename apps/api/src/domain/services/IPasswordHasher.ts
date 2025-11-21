import type { RepositoryError } from '@domain/errors/RepositoryError.js'
import type { Result } from '@team-pulse/shared/result'

/**
 * Password Hasher Interface (DOMAIN SERVICE)
 *
 * This is a DOMAIN SERVICE INTERFACE in Hexagonal Architecture:
 * - Defined in the domain layer (port)
 * - Implemented in the infrastructure layer (adapter)
 * - Used by application use cases
 *
 * Why is this needed?
 * - Password hashing is infrastructure concern (bcrypt, argon2, etc.)
 * - But use cases need to hash/verify passwords
 * - This interface inverts the dependency: Application depends on this interface,
 *   not on the concrete implementation
 *
 * Benefits:
 * - Easy to swap implementations (bcrypt -> argon2)
 * - Easy to test (mock the interface)
 * - Respects hexagonal architecture boundaries
 */
export interface IPasswordHasher {
  /**
   * Hash a plain text password
   *
   * @param password - The plain text password to hash
   * @returns A Result containing the hashed password or a RepositoryError if hashing fails
   */
  hash({ password }: { password: string }): Promise<Result<string, RepositoryError>>

  /**
   * Verify a plain text password against a hash
   *
   * @param password - The plain text password to verify
   * @param hash - The hashed password to compare against
   * @returns A Result containing true if the password matches, false otherwise, or a RepositoryError if verification fails
   */
  verify({ password, hash }: { password: string; hash: string }): Promise<Result<boolean, RepositoryError>>
}
