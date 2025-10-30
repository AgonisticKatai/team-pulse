import { describe, expect, it } from 'vitest'
import type { UserResponseDTO } from './dtos'
import type { HealthCheckResponse, Match } from './types'

describe('Shared Types', () => {
  describe('HealthCheckResponse', () => {
    it('should have correct structure', () => {
      const response: HealthCheckResponse = {
        status: 'ok',
        message: 'Test message',
        timestamp: new Date().toISOString(),
        environment: 'test',
      }

      expect(response.status).toBe('ok')
      expect(response.message).toBe('Test message')
      expect(response.environment).toBe('test')
    })
  })

  describe('UserResponseDTO', () => {
    it('should have correct structure', () => {
      const user: UserResponseDTO = {
        id: '123',
        email: 'test@example.com',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      expect(user.id).toBe('123')
      expect(user.email).toBe('test@example.com')
      expect(user.role).toBe('ADMIN')
      expect(typeof user.createdAt).toBe('string')
      expect(typeof user.updatedAt).toBe('string')
    })
  })

  describe('Match', () => {
    it('should have correct structure', () => {
      const match: Match = {
        id: '456',
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        date: new Date(),
        status: 'scheduled',
      }

      expect(match.id).toBe('456')
      expect(match.homeTeam).toBe('Team A')
      expect(match.awayTeam).toBe('Team B')
      expect(match.status).toBe('scheduled')
    })
  })
})
