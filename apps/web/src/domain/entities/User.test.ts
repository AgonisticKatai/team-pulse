import type { UserResponseDTO } from '@team-pulse/shared'
import { beforeEach, describe, expect, it } from 'vitest'
import { ValidationError } from '../errors'
import { Email, EntityId, Role, UserRole } from '../value-objects'
import { User } from './User'
import type { CreateUserData } from './User.types'

describe('User', () => {
  const createValidUserData = (): CreateUserData => ({
    createdAt: new Date('2024-01-15T10:00:00Z'),
    email: 'test@example.com',
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'user',
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  })

  describe('create()', () => {
    it('should create user with valid data', () => {
      // Arrange
      const data = createValidUserData()

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getId().getValue()).toBe(data.id)
      expect(user?.getEmail().getValue()).toBe(data.email)
      expect(user?.getRole().getValue()).toBe(UserRole.User)
    })

    it('should create user with Date objects for timestamps', () => {
      // Arrange
      const createdAt = new Date('2024-01-15T10:00:00Z')
      const updatedAt = new Date('2024-01-15T11:00:00Z')
      const data: CreateUserData = {
        ...createValidUserData(),
        createdAt,
        updatedAt,
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getCreatedAt()).toEqual(createdAt)
      expect(user?.getUpdatedAt()).toEqual(updatedAt)
    })

    it('should create user with string dates', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getCreatedAt()).toEqual(new Date('2024-01-15T10:00:00Z'))
      expect(user?.getUpdatedAt()).toEqual(new Date('2024-01-15T11:00:00Z'))
    })

    it('should create user with default dates when not provided', () => {
      // Arrange
      const before = Date.now()
      const { createdAt: _createdAt, updatedAt: _updatedAt, ...dataWithoutDates } = createValidUserData()

      // Act
      const [error, user] = User.create(dataWithoutDates)
      const after = Date.now()

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      const createdAtTime = user?.getCreatedAt().getTime()
      const updatedAtTime = user?.getUpdatedAt().getTime()
      expect(createdAtTime).toBeGreaterThanOrEqual(before)
      expect(createdAtTime).toBeLessThanOrEqual(after)
      expect(updatedAtTime).toBeGreaterThanOrEqual(before)
      expect(updatedAtTime).toBeLessThanOrEqual(after)
    })

    it('should create user with admin role', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        role: 'ADMIN',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getRole().getValue()).toBe(UserRole.Admin)
    })

    it('should create user with super admin role', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        role: 'SUPER_ADMIN',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getRole().getValue()).toBe(UserRole.SuperAdmin)
    })

    it('should fail with invalid id (empty string)', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        id: '',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('ID')
      expect(user).toBeNull()
    })

    it('should fail with invalid email format', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        email: 'invalid-email',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Email')
      expect(user).toBeNull()
    })

    it('should fail with empty email', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        email: '',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Email')
      expect(user).toBeNull()
    })

    it('should fail with invalid role', () => {
      // Arrange
      const data = {
        ...createValidUserData(),
        role: 'invalid-role',
      } as CreateUserData

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Invalid role')
      expect(user).toBeNull()
    })

    it('should fail with empty role', () => {
      // Arrange
      const data: CreateUserData = {
        ...createValidUserData(),
        role: '',
      }

      // Act
      const [error, user] = User.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Role')
      expect(user).toBeNull()
    })
  })

  describe('fromValueObjects()', () => {
    it('should create user from value objects', () => {
      // Arrange
      const [, id] = EntityId.create('123e4567-e89b-12d3-a456-426614174000')
      const [, email] = Email.create('test@example.com')
      const [, role] = Role.create('USER')
      const createdAt = new Date('2024-01-15T10:00:00Z')
      const updatedAt = new Date('2024-01-15T10:00:00Z')

      // Act
      const user = User.fromValueObjects({
        createdAt,
        email: email!,
        id: id!,
        role: role!,
        updatedAt,
      })

      // Assert
      expect(user).toBeDefined()
      expect(user.getId()).toBe(id)
      expect(user.getEmail()).toBe(email)
      expect(user.getRole()).toBe(role)
      expect(user.getCreatedAt()).toBe(createdAt)
      expect(user.getUpdatedAt()).toBe(updatedAt)
    })
  })

  describe('fromDTO()', () => {
    it('should create user from valid DTO', () => {
      // Arrange
      const dto: UserResponseDTO = {
        createdAt: '2024-01-15T10:00:00.000Z',
        email: 'test@example.com',
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'USER',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }

      // Act
      const [error, user] = User.fromDTO(dto)

      // Assert
      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user?.getId().getValue()).toBe(dto.id)
      expect(user?.getEmail().getValue()).toBe(dto.email)
      expect(user?.getRole().getValue()).toBe(UserRole.User)
    })

    it('should fail with invalid DTO (bad email)', () => {
      // Arrange
      const dto: UserResponseDTO = {
        createdAt: '2024-01-15T10:00:00.000Z',
        email: 'invalid-email',
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'USER',
        updatedAt: '2024-01-15T10:00:00.000Z',
      }

      // Act
      const [error, user] = User.fromDTO(dto)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Email')
      expect(user).toBeNull()
    })
  })

  describe('fromDTOList()', () => {
    it('should create empty array from empty DTO list', () => {
      // Arrange
      const dtos: UserResponseDTO[] = []

      // Act
      const [error, users] = User.fromDTOList(dtos)

      // Assert
      expect(error).toBeNull()
      expect(users).toBeDefined()
      expect(users).toHaveLength(0)
    })

    it('should create users from single DTO', () => {
      // Arrange
      const dtos: UserResponseDTO[] = [
        {
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test1@example.com',
          id: '123e4567-e89b-12d3-a456-426614174001',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
      ]

      // Act
      const [error, users] = User.fromDTOList(dtos)

      // Assert
      expect(error).toBeNull()
      expect(users).toBeDefined()
      expect(users).toHaveLength(1)
      expect(users?.[0]?.getEmail().getValue()).toBe('test1@example.com')
    })

    it('should create users from multiple DTOs', () => {
      // Arrange
      const dtos: UserResponseDTO[] = [
        {
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test1@example.com',
          id: '123e4567-e89b-12d3-a456-426614174001',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          createdAt: '2024-01-15T11:00:00.000Z',
          email: 'test2@example.com',
          id: '123e4567-e89b-12d3-a456-426614174002',
          role: 'ADMIN',
          updatedAt: '2024-01-15T11:00:00.000Z',
        },
      ]

      // Act
      const [error, users] = User.fromDTOList(dtos)

      // Assert
      expect(error).toBeNull()
      expect(users).toBeDefined()
      expect(users).toHaveLength(2)
      expect(users?.[0]?.getEmail().getValue()).toBe('test1@example.com')
      expect(users?.[1]?.getEmail().getValue()).toBe('test2@example.com')
      expect(users?.[1]?.getRole().getValue()).toBe(UserRole.Admin)
    })

    it('should fail with first invalid DTO in list', () => {
      // Arrange
      const dtos: UserResponseDTO[] = [
        {
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test1@example.com',
          id: '123e4567-e89b-12d3-a456-426614174001',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          createdAt: '2024-01-15T11:00:00.000Z',
          email: 'invalid-email',
          id: '123e4567-e89b-12d3-a456-426614174002',
          role: 'ADMIN',
          updatedAt: '2024-01-15T11:00:00.000Z',
        },
      ]

      // Act
      const [error, users] = User.fromDTOList(dtos)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Email')
      expect(users).toBeNull()
    })
  })

  describe('empty()', () => {
    it('should return null', () => {
      // Act
      const result = User.empty()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('Getters', () => {
    let user: User

    beforeEach(() => {
      const data = createValidUserData()
      const [error, createdUser] = User.create(data)
      expect(error).toBeNull()
      user = createdUser!
    })

    it('should get id', () => {
      // Act
      const id = user.getId()

      // Assert
      expect(id).toBeInstanceOf(EntityId)
      expect(id.getValue()).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should get email', () => {
      // Act
      const email = user.getEmail()

      // Assert
      expect(email).toBeInstanceOf(Email)
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should get role', () => {
      // Act
      const role = user.getRole()

      // Assert
      expect(role).toBeInstanceOf(Role)
      expect(role.getValue()).toBe(UserRole.User)
    })

    it('should get createdAt', () => {
      // Act
      const createdAt = user.getCreatedAt()

      // Assert
      expect(createdAt).toBeInstanceOf(Date)
      expect(createdAt).toEqual(new Date('2024-01-15T10:00:00Z'))
    })

    it('should get updatedAt', () => {
      // Act
      const updatedAt = user.getUpdatedAt()

      // Assert
      expect(updatedAt).toBeInstanceOf(Date)
      expect(updatedAt).toEqual(new Date('2024-01-15T10:00:00Z'))
    })
  })

  describe('Business Logic', () => {
    describe('hasRole()', () => {
      it('should return true when user has the specified role', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.hasRole(UserRole.User)).toBe(true)
      })

      it('should return false when user does not have the specified role', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.hasRole(UserRole.Admin)).toBe(false)
        expect(user?.hasRole(UserRole.SuperAdmin)).toBe(false)
      })

      it('should return true for admin role', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.hasRole(UserRole.Admin)).toBe(true)
        expect(user?.hasRole(UserRole.User)).toBe(false)
      })
    })

    describe('hasRoleLevel()', () => {
      it('should return true when user has same role level', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        const [, userRole] = Role.create('USER')

        // Act & Assert
        expect(user?.hasRoleLevel(userRole!)).toBe(true)
      })

      it('should return true when user has higher role level', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        const [, userRole] = Role.create('USER')

        // Act & Assert
        expect(user?.hasRoleLevel(userRole!)).toBe(true)
      })

      it('should return false when user has lower role level', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        const [, adminRole] = Role.create('ADMIN')

        // Act & Assert
        expect(user?.hasRoleLevel(adminRole!)).toBe(false)
      })
    })

    describe('isSuperAdmin()', () => {
      it('should return true for super admin', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'SUPER_ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isSuperAdmin()).toBe(true)
      })

      it('should return false for admin', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isSuperAdmin()).toBe(false)
      })

      it('should return false for user', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isSuperAdmin()).toBe(false)
      })
    })

    describe('isAdmin()', () => {
      it('should return true for super admin', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'SUPER_ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isAdmin()).toBe(true)
      })

      it('should return true for admin', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isAdmin()).toBe(true)
      })

      it('should return false for user', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        // Act & Assert
        expect(user?.isAdmin()).toBe(false)
      })
    })

    describe('canPerform()', () => {
      it('should return true when user can perform action', () => {
        // Arrange
        const data: CreateUserData = {
          ...createValidUserData(),
          role: 'ADMIN',
        }
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        const [, userRole] = Role.create('USER')

        // Act & Assert
        expect(user?.canPerform(userRole!)).toBe(true)
      })

      it('should return false when user cannot perform action', () => {
        // Arrange
        const data = createValidUserData()
        const [error, user] = User.create(data)
        expect(error).toBeNull()

        const [, adminRole] = Role.create('ADMIN')

        // Act & Assert
        expect(user?.canPerform(adminRole!)).toBe(false)
      })
    })

    describe('equals()', () => {
      it('should return true for same user', () => {
        // Arrange
        const data = createValidUserData()
        const [error1, user1] = User.create(data)
        const [error2, user2] = User.create(data)
        expect(error1).toBeNull()
        expect(error2).toBeNull()

        // Act & Assert
        expect(user1?.equals(user2!)).toBe(true)
      })

      it('should return false for different users', () => {
        // Arrange
        const data1 = createValidUserData()
        const data2: CreateUserData = {
          ...createValidUserData(),
          id: '123e4567-e89b-12d3-a456-426614174999',
        }
        const [error1, user1] = User.create(data1)
        const [error2, user2] = User.create(data2)
        expect(error1).toBeNull()
        expect(error2).toBeNull()

        // Act & Assert
        expect(user1?.equals(user2!)).toBe(false)
      })
    })
  })

  describe('Serialization', () => {
    let user: User

    beforeEach(() => {
      const data = createValidUserData()
      const [error, createdUser] = User.create(data)
      expect(error).toBeNull()
      user = createdUser!
    })

    describe('toObject()', () => {
      it('should convert to plain object', () => {
        // Act
        const obj = user.toObject()

        // Assert
        expect(obj).toEqual({
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test@example.com',
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        })
      })

      it('should have ISO string dates', () => {
        // Act
        const obj = user.toObject()

        // Assert
        expect(typeof obj.createdAt).toBe('string')
        expect(typeof obj.updatedAt).toBe('string')
        expect(obj.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    describe('toDTO()', () => {
      it('should convert to DTO', () => {
        // Act
        const dto = user.toDTO()

        // Assert
        expect(dto).toEqual({
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test@example.com',
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        })
      })

      it('should be symmetrical with fromDTO', () => {
        // Act
        const dto = user.toDTO()
        const [error, recreatedUser] = User.fromDTO(dto)

        // Assert
        expect(error).toBeNull()
        expect(recreatedUser?.equals(user)).toBe(true)
        expect(recreatedUser?.toDTO()).toEqual(dto)
      })
    })

    describe('toJSON()', () => {
      it('should convert to JSON', () => {
        // Act
        const json = user.toJSON()

        // Assert
        expect(json).toEqual({
          createdAt: '2024-01-15T10:00:00.000Z',
          email: 'test@example.com',
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-15T10:00:00.000Z',
        })
      })

      it('should match toObject output', () => {
        // Act
        const json = user.toJSON()
        const obj = user.toObject()

        // Assert
        expect(json).toEqual(obj)
      })

      it('should work with JSON.stringify', () => {
        // Act
        const jsonString = JSON.stringify(user)
        const parsed = JSON.parse(jsonString)

        // Assert
        expect(parsed).toEqual(user.toJSON())
      })
    })
  })
})
