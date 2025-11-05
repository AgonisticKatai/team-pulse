import { ValidationError } from '../errors/index.js'
import type { Result } from '../types/Result.js'
import { Err, Ok } from '../types/Result.js'

/**
 * User roles in the system
 * Matches backend UserRole enum from @team-pulse/shared
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * Role hierarchy levels (higher = more permissions)
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.ADMIN]: 2,
  [UserRole.USER]: 1,
}

/**
 * Role Value Object
 * Immutable with built-in hierarchy and permission logic
 */
export class Role {
  private readonly value: UserRole

  private constructor({ value }: { value: UserRole }) {
    this.value = value
  }

  /**
   * Validate if role is not empty
   */
  private static validateNotEmpty({ value }: { value: string }): Result<string, ValidationError> {
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'role', message: 'Role is required' }))
    }
    return Ok(value.trim().toUpperCase())
  }

  /**
   * Validate role value
   */
  private static validateRole({ value }: { value: string }): Result<UserRole, ValidationError> {
    if (!Object.values(UserRole).includes(value as UserRole)) {
      return Err(
        ValidationError.forField({
          field: 'role',
          message: `Invalid role: ${value}. Must be one of: ${Object.values(UserRole).join(', ')}`,
        }),
      )
    }
    return Ok(value as UserRole)
  }

  /**
   * Factory method to create a Role (creational pattern)
   * Returns [error, null] or [null, role]
   */
  static create({ value }: { value: string }): Result<Role, ValidationError> {
    // Validate not empty
    const [errorNotEmpty, normalizedValue] = Role.validateNotEmpty({ value })
    if (errorNotEmpty) {
      return Err(errorNotEmpty)
    }

    // Validate role value
    const [errorRole, roleValue] = Role.validateRole({ value: normalizedValue! })
    if (errorRole) {
      return Err(errorRole)
    }

    return Ok(new Role({ value: roleValue! }))
  }

  /**
   * Factory method from enum value (no validation needed)
   */
  static fromEnum({ value }: { value: UserRole }): Role {
    return new Role({ value })
  }

  /**
   * Get the role value
   */
  getValue(): UserRole {
    return this.value
  }

  /**
   * Get the role level (for hierarchy comparison)
   */
  getLevel(): number {
    return ROLE_LEVELS[this.value]
  }

  /**
   * Check if this role has equal or higher level than another role
   */
  hasLevelOf({ other }: { other: Role }): boolean {
    return this.getLevel() >= other.getLevel()
  }

  /**
   * Check if this role is a specific role
   */
  is({ role }: { role: UserRole }): boolean {
    return this.value === role
  }

  /**
   * Check if this role is SUPER_ADMIN
   */
  isSuperAdmin(): boolean {
    return this.value === UserRole.SUPER_ADMIN
  }

  /**
   * Check if this role is ADMIN or higher
   */
  isAdmin(): boolean {
    return this.value === UserRole.ADMIN || this.isSuperAdmin()
  }

  /**
   * Check if this role is USER
   */
  isUser(): boolean {
    return this.value === UserRole.USER
  }

  /**
   * Check if this role can perform an action that requires a minimum role
   */
  canPerform({ requiredRole }: { requiredRole: Role }): boolean {
    return this.hasLevelOf({ other: requiredRole })
  }

  /**
   * Check equality with another Role
   */
  equals({ other }: { other: Role }): boolean {
    return this.value === other.value
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value
  }
}
