import { describe, expect, it } from 'vitest'
import { expectZodError } from '../test-utils.js'
import { CreateTeamDTOSchema, UpdateTeamDTOSchema } from './team.dto.js'

describe('Team DTOs', () => {
  describe('CreateTeamDTOSchema', () => {
    describe('valid cases', () => {
      it('should validate correct team data with foundedYear', () => {
        const validData = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('FC Barcelona')
          expect(result.data.city).toBe('Barcelona')
          expect(result.data.foundedYear).toBe(1899)
        }
      })

      it('should accept team without foundedYear', () => {
        const validData = {
          city: 'Madrid',
          name: 'New Team',
        }

        const result = CreateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.foundedYear).toBeUndefined()
        }
      })

      it('should accept team with null foundedYear', () => {
        const validData = {
          city: 'Valencia',
          foundedYear: null,
          name: 'Another Team',
        }

        const result = CreateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.foundedYear).toBeNull()
        }
      })

      it('should trim team name', () => {
        const data = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: '  FC Barcelona  ',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('FC Barcelona')
        }
      })

      it('should trim city name', () => {
        const data = {
          city: '  Barcelona  ',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.city).toBe('Barcelona')
        }
      })
    })

    describe('name validation', () => {
      it('should reject empty name', () => {
        const data = {
          city: 'Barcelona',
          name: '',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Team name is required')
      })

      it('should reject name that becomes empty after trim', () => {
        const data = {
          city: 'Barcelona',
          name: '   ',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject name longer than 100 characters', () => {
        const data = {
          city: 'Barcelona',
          name: 'A'.repeat(101),
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Team name cannot exceed 100 characters')
      })

      it('should accept name at maximum length boundary (100 chars)', () => {
        const data = {
          city: 'Barcelona',
          name: 'A'.repeat(100),
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject missing name', () => {
        const data = {
          city: 'Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('city validation', () => {
      it('should reject empty city', () => {
        const data = {
          city: '',
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'City is required')
      })

      it('should reject city that becomes empty after trim', () => {
        const data = {
          city: '   ',
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject city longer than 100 characters', () => {
        const data = {
          city: 'B'.repeat(101),
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'City cannot exceed 100 characters')
      })

      it('should accept city at maximum length boundary (100 chars)', () => {
        const data = {
          city: 'B'.repeat(100),
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject missing city', () => {
        const data = {
          name: 'FC Barcelona',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    describe('foundedYear validation', () => {
      it('should reject year before 1800', () => {
        const data = {
          city: 'Madrid',
          foundedYear: 1799,
          name: 'Old Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year must be after 1800')
      })

      it('should accept year at minimum boundary (1800)', () => {
        const data = {
          city: 'Madrid',
          foundedYear: 1800,
          name: 'Historic Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject future year', () => {
        const currentYear = new Date().getFullYear()
        const data = {
          city: 'Madrid',
          foundedYear: currentYear + 1,
          name: 'Future Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year cannot be in the future')
      })

      it('should accept current year', () => {
        const currentYear = new Date().getFullYear()
        const data = {
          city: 'Madrid',
          foundedYear: currentYear,
          name: 'New Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject non-integer year', () => {
        const data = {
          city: 'Madrid',
          foundedYear: 1899.5,
          name: 'Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year must be an integer')
      })

      it('should reject non-number year', () => {
        const data = {
          city: 'Madrid',
          foundedYear: '1899',
          name: 'Team',
        }

        const result = CreateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('UpdateTeamDTOSchema', () => {
    describe('valid cases', () => {
      it('should validate partial update with all fields', () => {
        const validData = {
          city: 'Updated City',
          foundedYear: 1900,
          name: 'Updated Name',
        }

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('Updated Name')
          expect(result.data.city).toBe('Updated City')
          expect(result.data.foundedYear).toBe(1900)
        }
      })

      it('should validate update with only name', () => {
        const validData = {
          name: 'New Name',
        }

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('New Name')
          expect(result.data.city).toBeUndefined()
          expect(result.data.foundedYear).toBeUndefined()
        }
      })

      it('should validate update with only city', () => {
        const validData = {
          city: 'New City',
        }

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should validate update with only foundedYear', () => {
        const validData = {
          foundedYear: 1920,
        }

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should validate empty update (all fields optional)', () => {
        const validData = {}

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept null foundedYear', () => {
        const validData = {
          foundedYear: null,
        }

        const result = UpdateTeamDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.foundedYear).toBeNull()
        }
      })

      it('should trim name when provided', () => {
        const data = {
          name: '  Trimmed Name  ',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.name).toBe('Trimmed Name')
        }
      })

      it('should trim city when provided', () => {
        const data = {
          city: '  Trimmed City  ',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.city).toBe('Trimmed City')
        }
      })
    })

    describe('name validation', () => {
      it('should reject empty name when provided', () => {
        const data = {
          name: '',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Team name cannot be empty')
      })

      it('should reject name that becomes empty after trim', () => {
        const data = {
          name: '   ',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject name longer than 100 characters', () => {
        const data = {
          name: 'A'.repeat(101),
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Team name cannot exceed 100 characters')
      })
    })

    describe('city validation', () => {
      it('should reject empty city when provided', () => {
        const data = {
          city: '',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'City cannot be empty')
      })

      it('should reject city that becomes empty after trim', () => {
        const data = {
          city: '   ',
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject city longer than 100 characters', () => {
        const data = {
          city: 'B'.repeat(101),
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'City cannot exceed 100 characters')
      })
    })

    describe('foundedYear validation', () => {
      it('should reject year before 1800', () => {
        const data = {
          foundedYear: 1799,
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year must be after 1800')
      })

      it('should accept year at minimum boundary (1800)', () => {
        const data = {
          foundedYear: 1800,
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject future year', () => {
        const currentYear = new Date().getFullYear()
        const data = {
          foundedYear: currentYear + 1,
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year cannot be in the future')
      })

      it('should accept current year', () => {
        const currentYear = new Date().getFullYear()
        const data = {
          foundedYear: currentYear,
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should reject non-integer year', () => {
        const data = {
          foundedYear: 1899.5,
        }

        const result = UpdateTeamDTOSchema.safeParse(data)
        expectZodError(result, 'Founded year must be an integer')
      })
    })
  })
})
