import { DomainError } from '../../domain/errors'
import type { IStorageRepository } from '../../domain/repositories'
import type { Result } from '../../domain/types/Result'
import { Err, Ok } from '../../domain/types/Result'

/**
 * Local Storage Service Implementation
 * Adapts browser localStorage to IStorageRepository interface
 * Provides type-safe storage operations with error handling
 */
export class LocalStorageService implements IStorageRepository {
  /**
   * Get item from storage
   * Returns [error, null] or [null, value] or [null, null] if not found
   */
  getItem<T>(key: string): Result<T | null, DomainError> {
    try {
      const item = localStorage.getItem(key)

      if (item === null) {
        return Ok(null)
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(item) as T
        return Ok(parsed)
      } catch {
        // If parsing fails, return as string (if T is string)
        return Ok(item as T)
      }
    } catch (error) {
      return Err(
        new DomainError(`Failed to get item from storage: ${error instanceof Error ? error.message : 'Unknown error'}`, { isOperational: true }),
      )
    }
  }

  /**
   * Set item in storage
   * Returns [error, null] or [null, true]
   */
  setItem<T>(key: string, value: T): Result<true, DomainError> {
    try {
      // Serialize value
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)

      localStorage.setItem(key, serialized)

      return Ok(true)
    } catch (error) {
      return Err(
        new DomainError(`Failed to set item in storage: ${error instanceof Error ? error.message : 'Unknown error'}`, { isOperational: true }),
      )
    }
  }

  /**
   * Remove item from storage
   * Returns [error, null] or [null, true]
   */
  removeItem(key: string): Result<true, DomainError> {
    try {
      localStorage.removeItem(key)

      return Ok(true)
    } catch (error) {
      return Err(
        new DomainError(`Failed to remove item from storage: ${error instanceof Error ? error.message : 'Unknown error'}`, { isOperational: true }),
      )
    }
  }

  /**
   * Clear all items from storage
   * Returns [error, null] or [null, true]
   */
  clear(): Result<true, DomainError> {
    try {
      localStorage.clear()

      return Ok(true)
    } catch (error) {
      return Err(new DomainError(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`, { isOperational: true }))
    }
  }

  /**
   * Check if key exists in storage
   * Returns [error, null] or [null, exists]
   */
  hasItem(key: string): Result<boolean, DomainError> {
    try {
      const item = localStorage.getItem(key)

      return Ok(item !== null)
    } catch (error) {
      return Err(
        new DomainError(`Failed to check item in storage: ${error instanceof Error ? error.message : 'Unknown error'}`, { isOperational: true }),
      )
    }
  }
}
