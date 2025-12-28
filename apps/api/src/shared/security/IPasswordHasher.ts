import type { RepositoryError, Result } from '@team-pulse/shared'

/**
 * Password Hasher Interface (SHARED SECURITY CONTRACT)
 *
 * This is a SHARED PORT in Hexagonal Architecture:
 * - Defined in shared layer (used by multiple features)
 * - Implemented in infrastructure layer (concrete adapters)
 * - Used by application use cases across features
 *
 * Why in shared/?
 * - Password hashing is needed by multiple features (auth, users)
 * - Features should NOT depend on each other
 * - This interface breaks the coupling between features
 *
 * Implementation:
 * - ScryptPasswordHasher in features/auth/infrastructure/services/password-hasher/
 * - Or any other implementation (bcrypt, argon2, etc.)
 *
 * Dependency Injection:
 * - Container creates the implementation
 * - Injects it into use cases that need it
 * - Use cases depend only on this interface
 *
 * Benefits:
 * - Zero coupling between features
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
