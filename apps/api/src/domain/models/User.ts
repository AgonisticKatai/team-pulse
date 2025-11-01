import type { UserRole } from '@team-pulse/shared'
import { ValidationError } from '../errors/index.js'

/**
 * User Domain Entity
 *
 * Represents an authenticated user in the business domain.
 * This is a RICH DOMAIN MODEL - it encapsulates:
 * - Business data (email, role, etc.)
 * - Business rules (validation, invariants)
 * - Business behavior (methods for domain operations)
 *
 * This entity is FRAMEWORK-AGNOSTIC:
 * - No database dependencies
 * - No HTTP dependencies
 * - Pure TypeScript/JavaScript
 *
 * The infrastructure layer is responsible for persisting this entity.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    private readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    // Validate business invariants
    this.validateInvariants()
  }

  /**
   * Factory method to create a new User
   *
   * Use this instead of constructor for new users (not from DB)
   */
  static create(data: { id: string; email: string; passwordHash: string; role: UserRole }): User {
    return new User(data.id, data.email, data.passwordHash, data.role, new Date(), new Date())
  }

  /**
   * Factory method to reconstitute a User from persistence
   *
   * Use this when loading from database
   */
  static fromPersistence(data: {
    id: string
    email: string
    passwordHash: string
    role: UserRole
    createdAt: Date
    updatedAt: Date
  }): User {
    return new User(
      data.id,
      data.email,
      data.passwordHash,
      data.role,
      data.createdAt,
      data.updatedAt,
    )
  }

  /**
   * Validate business invariants
   *
   * These are the BUSINESS RULES that must always be true
   */
  private validateInvariants(): void {
    // Email validation - basic format check
    if (!this.email || this.email.trim().length === 0) {
      throw new ValidationError('Email cannot be empty', 'email')
    }

    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.email)) {
      throw new ValidationError('Invalid email format', 'email')
    }

    if (this.email.length > 255) {
      throw new ValidationError('Email cannot exceed 255 characters', 'email')
    }

    // Role validation
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'USER']
    if (!validRoles.includes(this.role)) {
      throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 'role')
    }

    // Password hash validation
    if (!this.passwordHash || this.passwordHash.trim().length === 0) {
      throw new ValidationError('Password hash cannot be empty', 'password')
    }
  }

  /**
   * Get password hash
   *
   * Only used by infrastructure layer for persistence and verification.
   * Should NEVER be exposed via DTOs or API responses.
   */
  getPasswordHash(): string {
    return this.passwordHash
  }

  /**
   * Update user information
   *
   * Returns a new User instance (immutability)
   */
  update(data: { email?: string; passwordHash?: string; role?: UserRole }): User {
    return new User(
      this.id,
      data.email ?? this.email,
      data.passwordHash ?? this.passwordHash,
      data.role ?? this.role,
      this.createdAt,
      new Date(), // Update timestamp
    )
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role === role
  }

  /**
   * Check if user has at least the specified role level
   * SUPER_ADMIN > ADMIN > USER
   */
  hasRoleLevel(minimumRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      ADMIN: 2,
      SUPER_ADMIN: 3,
      USER: 1,
    }

    return roleHierarchy[this.role] >= roleHierarchy[minimumRole]
  }

  /**
   * Check if user is SUPER_ADMIN
   */
  isSuperAdmin(): boolean {
    return this.role === 'SUPER_ADMIN'
  }

  /**
   * Check if user is ADMIN or SUPER_ADMIN
   */
  isAdmin(): boolean {
    return this.role === 'ADMIN' || this.role === 'SUPER_ADMIN'
  }

  /**
   * Convert to plain object for serialization
   *
   * IMPORTANT: Does NOT include passwordHash for security
   */
  toObject(): {
    id: string
    email: string
    role: UserRole
    createdAt: Date
    updatedAt: Date
  } {
    return {
      createdAt: this.createdAt,
      email: this.email,
      id: this.id,
      role: this.role,
      updatedAt: this.updatedAt,
    }
  }
}
