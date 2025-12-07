import type { PaginationMetadata } from '@team-pulse/shared/dtos'
import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

/**
 * Pagination Value Object (DOMAIN MODEL)
 *
 * A Value Object that encapsulates pagination logic and validates invariants.
 *
 * Value Object characteristics:
 * 1. Immutable - once created, cannot be modified
 * 2. Self-validating - enforces business rules
 * 3. Equality by value - two Pagination objects with same values are equal
 * 4. No identity - defined by its attributes, not by an ID
 *
 * Domain Invariants:
 * - page must be a positive integer (>= 1)
 * - limit must be between 1 and MAX_LIMIT (100)
 * - total must be non-negative (>= 0)
 * - totalPages is always calculated correctly
 *
 * Architecture Pattern (Standard for Value Objects):
 * - Fields: public readonly for immutability
 * - Factory method (create): Validates and calculates all derived values
 * - Constructor: Only assigns values (pure, no logic)
 * - Validation methods: Separate validateXXX() methods
 */
export class Pagination {
  protected static readonly MIN_PAGE = 1
  protected static readonly MIN_LIMIT = 1
  protected static readonly MAX_LIMIT = 100
  protected static readonly MIN_TOTAL = 0

  public readonly page: number
  public readonly limit: number
  public readonly total: number
  public readonly totalPages: number

  /**
   * Private constructor - only assigns values
   *
   * IMPORTANT: Constructor does NO validation or calculation.
   * All logic happens in the factory method.
   */
  private constructor({
    page,
    limit,
    total,
    totalPages,
  }: { page: number; limit: number; total: number; totalPages: number }) {
    this.page = page
    this.limit = limit
    this.total = total
    this.totalPages = totalPages
  }

  /**
   * Factory method to create a Pagination Value Object
   *
   * Responsibilities:
   * 1. Validate all parameters
   * 2. Calculate derived values (totalPages)
   * 3. Construct the object with validated values
   *
   * @param page - Current page number (must be >= 1)
   * @param limit - Items per page (must be between 1 and 100)
   * @param total - Total number of items (must be >= 0)
   * @returns Result<Pagination, ValidationError>
   */
  static create({
    page,
    limit,
    total,
  }: {
    page: number
    limit: number
    total: number
  }): Result<Pagination, ValidationError> {
    // Validate each parameter
    const pageValidation = Pagination.validatePage({ page })
    if (!pageValidation.ok) {
      return pageValidation
    }

    const limitValidation = Pagination.validateLimit({ limit })
    if (!limitValidation.ok) {
      return limitValidation
    }

    const totalValidation = Pagination.validateTotal({ total })
    if (!totalValidation.ok) {
      return totalValidation
    }

    // Calculate derived values
    const totalPages = Pagination.calculateTotalPages({ limit, total })

    // Construct with validated and calculated values
    return Ok(new Pagination({ limit, page, total, totalPages }))
  }

  /**
   * Validate page parameter
   *
   * Business Rules:
   * - Must be an integer
   * - Must be at least 1
   */
  protected static validatePage({ page }: { page: number }): Result<void, ValidationError> {
    if (!Number.isInteger(page)) {
      return Err(ValidationError.forField({ field: 'page', message: 'Page must be an integer' }))
    }

    if (page < Pagination.MIN_PAGE) {
      return Err(ValidationError.forField({ field: 'page', message: `Page must be at least ${Pagination.MIN_PAGE}` }))
    }

    return Ok(undefined)
  }

  /**
   * Validate limit parameter
   *
   * Business Rules:
   * - Must be an integer
   * - Must be at least 1
   * - Cannot exceed MAX_LIMIT (100)
   */
  protected static validateLimit({ limit }: { limit: number }): Result<void, ValidationError> {
    if (!Number.isInteger(limit)) {
      return Err(ValidationError.forField({ field: 'limit', message: 'Limit must be an integer' }))
    }

    if (limit < Pagination.MIN_LIMIT) {
      return Err(
        ValidationError.forField({ field: 'limit', message: `Limit must be at least ${Pagination.MIN_LIMIT}` }),
      )
    }

    if (limit > Pagination.MAX_LIMIT) {
      return Err(ValidationError.forField({ field: 'limit', message: `Limit cannot exceed ${Pagination.MAX_LIMIT}` }))
    }

    return Ok(undefined)
  }

  /**
   * Validate total parameter
   *
   * Business Rules:
   * - Must be an integer
   * - Must be non-negative (>= 0)
   */
  protected static validateTotal({ total }: { total: number }): Result<void, ValidationError> {
    if (!Number.isInteger(total)) {
      return Err(ValidationError.forField({ field: 'total', message: 'Total must be an integer' }))
    }

    if (total < Pagination.MIN_TOTAL) {
      return Err(
        ValidationError.forField({ field: 'total', message: `Total must be at least ${Pagination.MIN_TOTAL}` }),
      )
    }

    return Ok(undefined)
  }

  /**
   * Calculate total number of pages
   *
   * Domain logic for pagination calculation.
   * - If total is 0, return 0 pages
   * - Otherwise, calculate: ceil(total / limit)
   */
  protected static calculateTotalPages({ total, limit }: { total: number; limit: number }): number {
    if (total === 0) {
      return 0
    }

    return Math.ceil(total / limit)
  }

  /**
   * Convert to Data Transfer Object
   *
   * Maps the domain model to the DTO format expected by the API layer.
   * This maintains separation between domain and API concerns.
   */
  toDTO(): PaginationMetadata {
    return {
      limit: this.limit,
      page: this.page,
      total: this.total,
      totalPages: this.totalPages,
    }
  }

  /**
   * Check if there is a next page
   */
  hasNextPage(): boolean {
    return this.page < this.totalPages
  }

  /**
   * Check if there is a previous page
   */
  hasPreviousPage(): boolean {
    return this.page > 1
  }

  /**
   * Value Object equality
   * Two Pagination objects are equal if all their values are equal
   */
  equals(other: Pagination): boolean {
    return this.page === other.page && this.limit === other.limit && this.total === other.total
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `Pagination(page=${this.page}, limit=${this.limit}, total=${this.total}, totalPages=${this.totalPages})`
  }
}
