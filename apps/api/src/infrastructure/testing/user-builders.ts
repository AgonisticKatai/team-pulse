import { User } from '@domain/models/user/index.js'
import { faker } from '@faker-js/faker'
import type { CreateUserDTO } from '@team-pulse/shared'
import { IdUtils, USER_ROLES, type UserId } from '@team-pulse/shared'

// 1. SIMPLE DEFINITION: Only primitive types
type UserPrimitives = {
  id: string
  email: string
  role: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

// 2. DATA GENERATOR: Returns plain object with defaults
const generateRandomUserData = (): UserPrimitives => ({
  createdAt: new Date(),
  email: faker.internet.email(),
  id: UserId.random(),
  passwordHash: faker.internet.password(),
  role: USER_ROLES.ADMIN,
  updatedAt: new Date(),
})

// 3. BUILDER FUNCTION
export function buildUser(overrides: Partial<UserPrimitives> = {}): User {
  // A. Fusion of data (override wins always)
  const raw = {
    ...generateRandomUserData(),
    ...overrides,
  }

  // B. DOMAIN CREATION
  const result = User.create({
    createdAt: raw.createdAt,
    email: raw.email,
    id: UserId.create({ id: raw.id }),
    passwordHash: raw.passwordHash,
    role: raw.role,
    updatedAt: raw.updatedAt,
  })

  if (!result.ok) {
    throw new Error(`Failed to build User in test: ${result.error.message}`)
  }

  return result.value
}

/**
 * Builds a user with ADMIN role
 * Wrapper for clarity using the spread pattern
 */
export function buildAdminUser(overrides: Partial<UserPrimitives> = {}): User {
  return buildUser({
    role: USER_ROLES.ADMIN,
    ...overrides,
  })
}

/**
 * Builds a user with SUPER_ADMIN role
 */
export function buildSuperAdminUser(overrides: Partial<UserPrimitives> = {}): User {
  return buildUser({
    role: USER_ROLES.SUPER_ADMIN,
    ...overrides,
  })
}

/**
 * Builder for CreateUserDTO
 * Generates a valid DTO directly with Faker, without instantiating the Domain.
 * Faster and avoids complex validations if you only want to test JSON format.
 */
export function buildCreateUserDTO(overrides: Partial<CreateUserDTO> = {}): CreateUserDTO {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    role: USER_ROLES.ADMIN,
    ...overrides,
  }
}
