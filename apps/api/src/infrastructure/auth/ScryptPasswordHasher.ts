import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { Err, Ok, type Result } from '@team-pulse/shared'
import { RepositoryError } from '../../domain/errors/RepositoryError.js'
import type { IPasswordHasher } from '../../domain/services/IPasswordHasher.js'

/**
 * Scrypt Password Hasher Implementation (INFRASTRUCTURE ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the IPasswordHasher domain service interface
 * - Uses Node.js native crypto module with scrypt
 * - Lives in infrastructure layer
 *
 * Why scrypt?
 * - Memory-hard algorithm resistant to hardware attacks (ASIC/FPGA)
 * - Built into Node.js (no external dependencies)
 * - Recommended by security experts for password hashing
 * - Better resistance against parallel attacks than bcrypt
 *
 * Hash Format: salt:hash
 * - Salt: 16 bytes (32 hex chars)
 * - Hash: 64 bytes (128 hex chars) derived using scrypt
 */
export class ScryptPasswordHasher implements IPasswordHasher {
  /**
   * Key length for scrypt output (in bytes)
   * 64 bytes = 512 bits provides strong security
   */
  private readonly keyLength: number

  /**
   * CPU/memory cost parameter
   * Higher = more secure but slower
   * 16384 (2^14) is a good balance for production
   */
  private readonly cost: number

  /**
   * Block size parameter
   * 8 is the recommended value
   */
  private readonly blockSize: number

  /**
   * Parallelization parameter
   * 1 prevents parallel attacks
   */
  private readonly parallelization: number

  private constructor({
    keyLength = 64,
    cost = 16384,
    blockSize = 8,
    parallelization = 1,
  }: {
    keyLength?: number
    cost?: number
    blockSize?: number
    parallelization?: number
  } = {}) {
    this.keyLength = keyLength
    this.cost = cost
    this.blockSize = blockSize
    this.parallelization = parallelization
  }

  static create({
    keyLength = 64,
    cost = 16384,
    blockSize = 8,
    parallelization = 1,
  }: {
    keyLength?: number
    cost?: number
    blockSize?: number
    parallelization?: number
  } = {}): ScryptPasswordHasher {
    return new ScryptPasswordHasher({ keyLength, cost, blockSize, parallelization })
  }

  /**
   * Hash a plain text password using scrypt
   *
   * Returns Result to handle potential hashing failures gracefully
   * Format: salt:hash (both in hex)
   */
  async hash({ password }: { password: string }): Promise<Result<string, RepositoryError>> {
    try {
      // Generate a random salt (16 bytes = 128 bits)
      const salt = randomBytes(16)

      // Derive key using scrypt
      // Using sync version wrapped in Promise to maintain async interface
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        try {
          const key = scryptSync(password, salt, this.keyLength, {
            N: this.cost,
            r: this.blockSize,
            p: this.parallelization,
            maxmem: 128 * this.cost * this.blockSize * 2,
          })
          resolve(key)
        } catch (err) {
          reject(err)
        }
      })

      // Return salt and hash as hex strings separated by colon
      const hash = `${salt.toString('hex')}:${derivedKey.toString('hex')}`
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
   * Verify a plain text password against a scrypt hash
   *
   * Returns Result to handle potential verification failures gracefully
   * Expects hash format: salt:hash (both in hex)
   */
  async verify({ password, hash }: { password: string; hash: string }): Promise<Result<boolean, RepositoryError>> {
    try {
      // Split hash into salt and hash components
      const parts = hash.split(':')
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return Ok(false)
      }

      const [saltHex, hashHex] = parts
      const salt = Buffer.from(saltHex, 'hex')
      const storedHash = Buffer.from(hashHex, 'hex')

      // Derive key using the same salt
      const derivedKey = await new Promise<Buffer>((resolve, reject) => {
        try {
          const key = scryptSync(password, salt, this.keyLength, {
            N: this.cost,
            r: this.blockSize,
            p: this.parallelization,
            maxmem: 128 * this.cost * this.blockSize * 2,
          })
          resolve(key)
        } catch (err) {
          reject(err)
        }
      })

      // Use timing-safe comparison to prevent timing attacks
      const isValid = timingSafeEqual(storedHash, derivedKey)
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
