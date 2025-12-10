import { faker } from '@faker-js/faker'
import { buildCreateTeamDTO, buildTeam } from '@infrastructure/testing/team-builders.js'
import { ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { describe, expect, it } from 'vitest'
import { Team } from './Team.js'

describe('Team Entity', () => {
  // ===========================================================================
  // 1. CREATE (Factory & Validation)
  // ===========================================================================
  describe('create', () => {
    it('should create a valid Team instance with full data', () => {
      // Arrange
      const input = buildCreateTeamDTO()

      // Act
      const result = Team.create({ ...input, id: faker.string.uuid() })

      // Assert
      const team = expectSuccess(result)
      expect(team).toBeInstanceOf(Team)
      expect(team.id).toBeDefined() // Verifica que TeamId es válido
      expect(team.name.name).toBe(input.name)
    })

    it('should fail if any inner Value Object is invalid (Fail Fast)', () => {
      // Arrange: Invalid name (too short)
      const input = buildCreateTeamDTO({ name: 'a' })

      // Act
      const result = Team.create({ ...input, id: faker.string.uuid() })

      // Assert: The error propagates from TeamName -> combine -> Team
      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 2. UPDATE (Immutability & Merge Logic)
  // ===========================================================================
  describe('update', () => {
    it('should update simple fields and return a NEW instance', () => {
      // Arrange
      const team = buildTeam({ updatedAt: faker.date.past() })
      const newName = 'Updated Name FC'

      // Act
      const result = team.update({ name: newName })

      // Assert
      const updatedTeam = expectSuccess(result)

      expect(updatedTeam).not.toBe(team) // Inmutabilidad
      expect(updatedTeam.id).toBe(team.id) // Identidad preservada
      expect(updatedTeam.name.name).toBe(newName) // Cambio aplicado
      expect(updatedTeam.updatedAt.getTime()).toBeGreaterThan(team.updatedAt.getTime()) // Audit actualizado
    })

    // 🛡️ THE HOLY GRAIL: TRI-STATE TESTING (Undefined vs Null vs Value)
    // Esto valida que tu utilidad 'merge' funciona integrada en la entidad

    it('should IGNORE undefined fields (Keep original value)', () => {
      const originalYear = 1990
      const team = buildTeam({ foundedYear: originalYear })

      // Act: Pasamos undefined (simulando que el campo no vino en el request)
      const updatedTeam = expectSuccess(team.update({ foundedYear: undefined }))

      // Assert: Se mantiene el 1990 original
      expect(updatedTeam.foundedYear?.year).toBe(originalYear)
    })

    it('should APPLY null fields (Erase value)', () => {
      const team = buildTeam({ foundedYear: 1990 })

      // Act: Pasamos null explícito (simulando borrado)
      const updatedTeam = expectSuccess(team.update({ foundedYear: null }))

      // Assert: El valor ahora es null
      expect(updatedTeam.foundedYear?.year).toBeNull()
    })

    it('should APPLY new values (Overwrite value)', () => {
      const team = buildTeam({ foundedYear: 1990 })

      // Act: Pasamos nuevo valor
      const updatedTeam = expectSuccess(team.update({ foundedYear: 2000 }))

      // Assert: El valor cambia
      expect(updatedTeam.foundedYear?.year).toBe(2000)
    })

    it('should fail if the update creates an invalid state', () => {
      const team = buildTeam()

      // Act: Intentamos poner un nombre inválido
      const result = team.update({ name: '' })

      // Assert
      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 3. SERIALIZATION
  // ===========================================================================
  describe('toPrimitives', () => {
    it('should return a plain object matching the internal state', () => {
      const team = buildTeam()
      const primitives = team.toPrimitives()

      expect(primitives.id).toBe(team.id) // Recuerda: id es string en runtime
      expect(primitives.name).toBe(team.name.name)
      expect(primitives.createdAt).toBeInstanceOf(Date)
    })
  })
})
