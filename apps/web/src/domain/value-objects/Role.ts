import { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'

/**
 * User roles in the system
 * Matches backend UserRole enum
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
  private constructor(private readonly value: UserRole) {}

  /**
   * Factory method to create a Role (creational pattern)
   * Returns [error, null] or [null, role]
   */
  static create(value: string): Result<Role, ValidationError> {
    // Handle empty case
    if (!value || value.trim().length === 0) {
      return Err(ValidationError.forField('role', 'Role is required'))
    }

    // Validate role value
    const normalizedValue = value.trim().toUpperCase()
    if (!Object.values(UserRole).includes(normalizedValue as UserRole)) {
      return Err(
        ValidationError.forField(
          'role',
          `Invalid role: ${value}. Must be one of: ${Object.values(UserRole).join(', ')}`,
        ),
      )
    }

    return Ok(new Role(normalizedValue as UserRole))
  }

  /**
   * Factory method from enum value (no validation needed)
   */
  static fromEnum(value: UserRole): Role {
    return new Role(value)
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
  hasLevelOf(other: Role): boolean {
    return this.getLevel() >= other.getLevel()
  }

  /**
   * Check if this role is a specific role
   */
  is(role: UserRole): boolean {
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
  canPerform(requiredRole: Role): boolean {
    return this.hasLevelOf(requiredRole)
  }

  /**
   * Check equality with another Role
   */
  equals(other: Role): boolean {
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
