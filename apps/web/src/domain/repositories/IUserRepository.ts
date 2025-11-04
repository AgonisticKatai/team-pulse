import type { User } from '../entities'
import type { DomainError } from '../errors'
import type { Result } from '../types/Result'

/**
 * User creation data
 */
export interface CreateUserData {
  email: string
  password: string
  role: string
}

/**
 * User Repository Interface (PORT)
 * Defines the contract for user operations
 */
export interface IUserRepository {
  /**
   * Find user by ID
   * Returns [error, null] or [null, user] or [null, null] if not found
   */
  findById(id: string): Promise<Result<User | null, DomainError>>

  /**
   * Find user by email
   * Returns [error, null] or [null, user] or [null, null] if not found
   */
  findByEmail(email: string): Promise<Result<User | null, DomainError>>

  /**
   * Get all users
   * Returns [error, null] or [null, users[]]
   */
  findAll(): Promise<Result<User[], DomainError>>

  /**
   * Create new user
   * Returns [error, null] or [null, user]
   */
  create(data: CreateUserData): Promise<Result<User, DomainError>>

  /**
   * Count total users
   * Returns [error, null] or [null, count]
   */
  count(): Promise<Result<number, DomainError>>
}
