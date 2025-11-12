import bcrypt from 'bcryptjs'

/**
 * Password hashing utilities using bcrypt
 *
 * Provides functions to securely hash and verify passwords.
 * Uses bcrypt which is a slow hashing algorithm designed for passwords
 * to resist brute-force attacks.
 */

/**
 * Number of salt rounds for bcrypt
 * Higher = more secure but slower
 * 10 rounds is a good balance for production
 */
const SALT_ROUNDS = 10

/**
 * Hash a plain text password
 *
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a plain text password against a hash
 *
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
