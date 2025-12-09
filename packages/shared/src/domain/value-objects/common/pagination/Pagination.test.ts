import type { PaginationDTO } from '@dtos/pagination.dto.js'
import { ValidationError } from '@errors/ValidationError.js'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { Pagination } from './Pagination.js'
import { PAGINATION_RULES } from './Pagination.rules'
import type { PaginationInput } from './Pagination.schema.js'

describe('Pagination Value Object', () => {
  describe('create', () => {
    it('should create a valid instance with valid inputs', () => {
      // Arrange
      const input = {
        limit: faker.number.int({ max: 50, min: 1 }),
        page: faker.number.int({ max: 10, min: 1 }),
        total: faker.number.int({ max: 1000, min: 100 }),
      } satisfies PaginationInput

      // Act
      const pagination = expectSuccess(Pagination.create(input))

      // Assert
      expect(pagination).toBeInstanceOf(Pagination)
      expect(pagination.page).toBe(input.page)
      expect(pagination.limit).toBe(input.limit)
      expect(pagination.total).toBe(input.total)
    })

    // -------------------------------------------------------------------------
    // SCHEMA SANITIZATION TESTS (Schema.catch behavior)
    // -------------------------------------------------------------------------

    it('should sanitize invalid page (<= 0) to default', () => {
      const pagination = expectSuccess(
        Pagination.create({
          limit: 10,
          page: -5, // 💥 Invalid
          total: 100,
        }),
      )

      expect(pagination.page).toBe(PAGINATION_RULES.DEFAULT_PAGE)
    })

    it('should sanitize invalid limit (too high) to default', () => {
      const pagination = expectSuccess(
        Pagination.create({
          limit: 99999, // 💥 Invalid (> MAX_LIMIT)
          page: 1,
          total: 100,
        }),
      )

      expect(pagination.limit).toBe(PAGINATION_RULES.DEFAULT_LIMIT)
    })

    it('should sanitize strings to numbers (coerce)', () => {
      const pagination = expectSuccess(
        Pagination.create({
          limit: '20' as any,
          page: '5' as any, // Simulating query params or bad payload
          total: '50' as any,
        }),
      )

      expect(pagination.page).toBe(5)
      expect(pagination.limit).toBe(20)
      expect(pagination.total).toBe(50)
    })

    // -------------------------------------------------------------------------
    // VALIDATION ERROR TESTS
    // Solo falla si la estructura es fundamentalmente incorrecta (no es un objeto)
    // -------------------------------------------------------------------------

    it('should return ValidationError if input is not an object', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Pagination.create(null as any),
      })
    })
  })

  // -------------------------------------------------------------------------
  // BUSINESS LOGIC TESTS (Calculated Properties)
  // -------------------------------------------------------------------------
  describe('Calculated Properties', () => {
    it('should calculate totalPages correctly', () => {
      // Case 1: Exact division (100 / 10 = 10)
      const exact = expectSuccess(Pagination.create({ limit: 10, page: 1, total: 100 }))
      expect(exact.totalPages).toBe(10)

      // Case 2: Round up (101 / 10 = 11)
      const roundup = expectSuccess(Pagination.create({ limit: 10, page: 1, total: 101 }))
      expect(roundup.totalPages).toBe(11)

      // Case 3: Zero items (should be at least 1 page)
      const empty = expectSuccess(Pagination.create({ limit: 10, page: 1, total: 0 }))
      expect(empty.totalPages).toBe(PAGINATION_RULES.MIN_PAGE)
    })

    it('should determine hasNext correctly', () => {
      const total = 50
      const limit = 10 // 5 Pages total

      // Page 1 (1 < 5) -> True
      const p1 = expectSuccess(Pagination.create({ limit, page: 1, total }))
      expect(p1.hasNext).toBe(true)

      // Page 4 (4 < 5) -> True
      const p4 = expectSuccess(Pagination.create({ limit, page: 4, total }))
      expect(p4.hasNext).toBe(true)

      // Page 5 (5 < 5 is false) -> False
      const p5 = expectSuccess(Pagination.create({ limit, page: 5, total }))
      expect(p5.hasNext).toBe(false)
    })

    it('should determine hasPrev correctly', () => {
      const total = 50
      const limit = 10

      // Page 1 -> False
      const p1 = expectSuccess(Pagination.create({ limit, page: 1, total }))
      expect(p1.hasPrev).toBe(false)

      // Page 2 -> True
      const p2 = expectSuccess(Pagination.create({ limit, page: 2, total }))
      expect(p2.hasPrev).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // MAPPING TESTS (DTOs)
  // -------------------------------------------------------------------------
  describe('Mapping methods', () => {
    it('toDTO should return expected DTO structure', () => {
      // Arrange
      const page = 2
      const limit = 5
      const total = 20
      const pagination = expectSuccess(Pagination.create({ limit, page, total }))

      // Act
      const dto = pagination.toDTO()

      // Assert
      expect(dto).toEqual({
        hasNext: true,
        hasPrev: true,
        limit: 5,
        page: 2,
        total: 20,
        totalPages: 4,
      })
    })

    it('fromDTO should create a valid Pagination instance', () => {
      // Arrange
      const dtoMock = {
        hasNext: false,
        hasPrev: false,
        limit: 15,
        page: 3,
        total: 45,
        // These fields are ignored/recalculated by fromDTO logic usually
        totalPages: 999,
      } satisfies PaginationDTO

      // Act
      const pagination = expectSuccess(Pagination.fromDTO(dtoMock))

      // Assert
      expect(pagination).toBeInstanceOf(Pagination)
      expect(pagination.page).toBe(3)
      expect(pagination.limit).toBe(15)
      expect(pagination.total).toBe(45)
      // Logic verified: totalPages is recalculated correctly (45/15 = 3), ignoring the '999' from DTO
      expect(pagination.totalPages).toBe(3)
    })
  })
})
