import type { DomainError } from '../errors'
import type { Result } from '../types/Result'

/**
 * Storage Repository Interface (PORT)
 * Defines the contract for local storage operations
 */
export interface IStorageRepository {
  /**
   * Get item from storage
   * Returns [error, null] or [null, value] or [null, null] if not found
   */
  getItem<T>(key: string): Result<T | null, DomainError>

  /**
   * Set item in storage
   * Returns [error, null] or [null, true]
   */
  setItem<T>(key: string, value: T): Result<true, DomainError>

  /**
   * Remove item from storage
   * Returns [error, null] or [null, true]
   */
  removeItem(key: string): Result<true, DomainError>

  /**
   * Clear all items from storage
   * Returns [error, null] or [null, true]
   */
  clear(): Result<true, DomainError>

  /**
   * Check if key exists in storage
   * Returns [error, null] or [null, exists]
   */
  hasItem(key: string): Result<boolean, DomainError>
}
