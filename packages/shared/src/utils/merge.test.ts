import { describe, expect, it } from 'vitest'
import { merge } from './merge.js'

describe('Object Utils', () => {
  describe('merge', () => {
    // Define an interface for the test object to ensure typing
    interface TestObj {
      id: number
      name: string
      description: string | null
      age?: number
      active: boolean
    }

    const baseState: TestObj = {
      active: true,
      age: 25,
      description: 'Original Description',
      id: 1,
      name: 'Original Name',
    }

    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH
    // -------------------------------------------------------------------------

    it('should update simple values correctly', () => {
      const update = { active: false, name: 'New Name' }

      const result = merge({ current: baseState, update })

      expect(result.name).toBe('New Name')
      expect(result.active).toBe(false)
      // The untouched values should remain
      expect(result.id).toBe(1)
    })

    // -------------------------------------------------------------------------
    // 🛡️ THE UNDEFINED GUARD
    // -------------------------------------------------------------------------

    it('should IGNORE undefined values in update (keep original)', () => {
      // Simulate what happens when an optional DTO is not sent
      const update: Partial<TestObj> = {
        age: undefined, // This should be ignored
        name: 'New Name',
      }

      const result = merge({ current: baseState, update })

      expect(result.name).toBe('New Name') // Se actualiza
      expect(result.age).toBe(25) // SE MANTIENE (No se convierte en undefined)
    })

    // -------------------------------------------------------------------------
    // 🗑️ THE NULL HANDLING
    // -------------------------------------------------------------------------

    it('should APPLY null values (overwrite original)', () => {
      // Simulate what happens when an optional DTO is not sent
      const update: Partial<TestObj> = { description: null }

      const result = merge({ current: baseState, update })

      expect(result.description).toBeNull() // Should be overwritten
    })

    // -------------------------------------------------------------------------
    // 🧬 IMMUTABILITY & REFERENCES
    // -------------------------------------------------------------------------

    it('should return a NEW object instance (immutability)', () => {
      const update = { name: 'New' }
      const result = merge({ current: baseState, update })

      expect(result).not.toBe(baseState) // Should return a new object instance
      expect(baseState.name).toBe('Original Name') // The original should not mutate
    })

    it('should handle empty updates gracefully', () => {
      const result = merge({ current: baseState, update: {} })

      expect(result).toEqual(baseState)
      expect(result).not.toBe(baseState) // Should return a new object instance
    })

    // -------------------------------------------------------------------------
    // 🧪 MIXED SCENARIO
    // -------------------------------------------------------------------------

    it('should handle a mix of value, null, and undefined correctly', () => {
      const complexState: TestObj = { ...baseState, age: 30 }

      const update: Partial<TestObj> = {
        age: undefined, // Undefined -> Ignores (Mantiene 30)
        description: null, // Null -> Deletes
        name: 'Updated', // Value -> Updates
      }

      const result = merge({ current: complexState, update })

      expect(result).toEqual({
        active: true,
        age: 30, // Should maintain the 30, not set undefined
        description: null, // Should be deleted
        id: 1,
        name: 'Updated', // Should be updated
      })
    })
  })
})
