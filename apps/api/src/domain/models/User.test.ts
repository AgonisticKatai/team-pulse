import type { UserRole } from '@team-pulse/shared'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { User } from './User.js'

describe('User Domain Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hashed-password',
        role: 'USER',
      })

      expect(user).toBeInstanceOf(User)
      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.role).toBe('USER')
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should create user with different roles', () => {
      const user1 = User.create({
        email: 'user@example.com',
        id: 'user-1',
        passwordHash: 'hash',
        role: 'USER',
      })

      const user2 = User.create({
        email: 'admin@example.com',
        id: 'user-2',
        passwordHash: 'hash',
        role: 'ADMIN',
      })

      const user3 = User.create({
        email: 'superadmin@example.com',
        id: 'user-3',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
      })

      expect(user1.role).toBe('USER')
      expect(user2.role).toBe('ADMIN')
      expect(user3.role).toBe('SUPER_ADMIN')
    })

    it('should throw error for empty email', () => {
      expect(() =>
        User.create({
          email: '',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for invalid email format', () => {
      expect(() =>
        User.create({
          email: 'invalid-email',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for email without domain', () => {
      expect(() =>
        User.create({
          email: 'test@',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for email too long', () => {
      const longEmail = `${'a'.repeat(250)}@example.com` // > 255 chars
      expect(() =>
        User.create({
          email: longEmail,
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for invalid role', () => {
      expect(() =>
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'INVALID_ROLE' as UserRole,
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for empty password hash', () => {
      expect(() =>
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: '',
          role: 'USER',
        }),
      ).toThrow(ValidationError)
    })
  })

  describe('fromPersistence', () => {
    it('should reconstitute user from database', () => {
      const now = new Date()
      const user = User.fromPersistence({
        createdAt: now,
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'ADMIN',
        updatedAt: now,
      })

      expect(user).toBeInstanceOf(User)
      expect(user.id).toBe('user-123')
      expect(user.createdAt).toBe(now)
      expect(user.updatedAt).toBe(now)
    })
  })

  describe('update', () => {
    it('should update user email', () => {
      const user = User.create({
        email: 'old@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'USER',
      })

      const updated = user.update({ email: 'new@example.com' })

      expect(updated.email).toBe('new@example.com')
      expect(updated.id).toBe(user.id)
      expect(updated.updatedAt).not.toBe(user.updatedAt)
    })

    it('should update user role', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'USER',
      })

      const updated = user.update({ role: 'ADMIN' })

      expect(updated.role).toBe('ADMIN')
    })

    it('should update password hash', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'old-hash',
        role: 'USER',
      })

      const updated = user.update({ passwordHash: 'new-hash' })

      expect(updated.getPasswordHash()).toBe('new-hash')
    })

    it('should preserve original values if not updated', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'USER',
      })

      const updated = user.update({ email: 'new@example.com' })

      expect(updated.role).toBe(user.role)
      expect(updated.getPasswordHash()).toBe(user.getPasswordHash())
    })

    it('should return new instance (immutability)', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'USER',
      })

      const updated = user.update({ email: 'new@example.com' })

      expect(updated).not.toBe(user)
      expect(user.email).toBe('test@example.com') // Original unchanged
    })
  })

  describe('role checking methods', () => {
    it('hasRole should check exact role', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'ADMIN',
      })

      expect(user.hasRole('ADMIN')).toBe(true)
      expect(user.hasRole('USER')).toBe(false)
      expect(user.hasRole('SUPER_ADMIN')).toBe(false)
    })

    it('hasRoleLevel should check role hierarchy', () => {
      const superAdmin = User.create({
        email: 'super@example.com',
        id: 'user-1',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
      })

      const admin = User.create({
        email: 'admin@example.com',
        id: 'user-2',
        passwordHash: 'hash',
        role: 'ADMIN',
      })

      const user = User.create({
        email: 'user@example.com',
        id: 'user-3',
        passwordHash: 'hash',
        role: 'USER',
      })

      // SUPER_ADMIN has all levels
      expect(superAdmin.hasRoleLevel('USER')).toBe(true)
      expect(superAdmin.hasRoleLevel('ADMIN')).toBe(true)
      expect(superAdmin.hasRoleLevel('SUPER_ADMIN')).toBe(true)

      // ADMIN has ADMIN and USER level
      expect(admin.hasRoleLevel('USER')).toBe(true)
      expect(admin.hasRoleLevel('ADMIN')).toBe(true)
      expect(admin.hasRoleLevel('SUPER_ADMIN')).toBe(false)

      // USER only has USER level
      expect(user.hasRoleLevel('USER')).toBe(true)
      expect(user.hasRoleLevel('ADMIN')).toBe(false)
      expect(user.hasRoleLevel('SUPER_ADMIN')).toBe(false)
    })

    it('isSuperAdmin should identify SUPER_ADMIN', () => {
      const superAdmin = User.create({
        email: 'super@example.com',
        id: 'user-1',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
      })

      const admin = User.create({
        email: 'admin@example.com',
        id: 'user-2',
        passwordHash: 'hash',
        role: 'ADMIN',
      })

      expect(superAdmin.isSuperAdmin()).toBe(true)
      expect(admin.isSuperAdmin()).toBe(false)
    })

    it('isAdmin should identify ADMIN or SUPER_ADMIN', () => {
      const superAdmin = User.create({
        email: 'super@example.com',
        id: 'user-1',
        passwordHash: 'hash',
        role: 'SUPER_ADMIN',
      })

      const admin = User.create({
        email: 'admin@example.com',
        id: 'user-2',
        passwordHash: 'hash',
        role: 'ADMIN',
      })

      const user = User.create({
        email: 'user@example.com',
        id: 'user-3',
        passwordHash: 'hash',
        role: 'USER',
      })

      expect(superAdmin.isAdmin()).toBe(true)
      expect(admin.isAdmin()).toBe(true)
      expect(user.isAdmin()).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'hash',
        role: 'USER',
      })

      const obj = user.toObject()

      expect(obj.id).toBe('user-123')
      expect(obj.email).toBe('test@example.com')
      expect(obj.role).toBe('USER')
      expect(obj.createdAt).toBeInstanceOf(Date)
      expect(obj.updatedAt).toBeInstanceOf(Date)
    })

    it('should NOT include password hash in toObject', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'secret-hash',
        role: 'USER',
      })

      const obj = user.toObject()

      expect(obj).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(obj)).not.toContain('secret-hash')
    })
  })

  describe('getPasswordHash', () => {
    it('should return password hash', () => {
      const user = User.create({
        email: 'test@example.com',
        id: 'user-123',
        passwordHash: 'secret-hash',
        role: 'USER',
      })

      expect(user.getPasswordHash()).toBe('secret-hash')
    })
  })
})
