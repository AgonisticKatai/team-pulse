import type { UserResponseDTO } from '@team-pulse/shared/dtos'
import type { ValidationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import { Email, EntityId, Role, type UserRole } from '../value-objects'
import type { CreateUserData, UserConstructorProps, UserData, UserProps } from './User.types'

// Re-export public types
export type { CreateUserData, UserData, UserProps }

/**
 * User Entity
 * Rich domain model with business logic
 */
export class User {
  private readonly id: EntityId
  private readonly email: Email
  private readonly role: Role
  private readonly createdAt: Date
  private readonly updatedAt: Date

  private constructor(props: UserConstructorProps) {
    this.id = props.id
    this.email = props.email
    this.role = props.role
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  /**
   * Factory method to create a User from domain primitives
   * Returns [error, null] or [null, user]
   */
  static create(data: CreateUserData): Result<User, ValidationError> {
    // Validate and create EntityId
    const [idError, entityId] = EntityId.create(data.id)
    if (idError) return Err(idError)

    // Validate and create Email
    const [emailError, email] = Email.create(data.email)
    if (emailError) return Err(emailError)

    // Validate and create Role
    const [roleError, role] = Role.create(data.role)
    if (roleError) return Err(roleError)

    // Handle dates
    const createdAt = data.createdAt instanceof Date ? data.createdAt : data.createdAt ? new Date(data.createdAt) : new Date()

    const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt ? new Date(data.updatedAt) : new Date()

    return Ok(
      new User({
        createdAt,
        email,
        id: entityId,
        role,
        updatedAt,
      }),
    )
  }

  /**
   * Factory method to create a User from Value Objects
   * No validation needed (Value Objects are already validated)
   */
  static fromValueObjects(props: UserProps): User {
    return new User(props)
  }

  /**
   * Factory method to create a User from DTO
   * Returns [error, null] or [null, user]
   */
  static fromDTO(dto: UserResponseDTO): Result<User, ValidationError> {
    return User.create({
      createdAt: dto.createdAt,
      email: dto.email,
      id: dto.id,
      role: dto.role,
      updatedAt: dto.updatedAt,
    })
  }

  /**
   * Factory method to create array of Users from array of DTOs
   * Returns [error, null] or [null, users[]]
   * If any DTO fails to map, returns error for the first failure
   */
  static fromDTOList(dtos: UserResponseDTO[]): Result<User[], ValidationError> {
    const users: User[] = []

    for (const dto of dtos) {
      const [error, user] = User.fromDTO(dto)
      if (error) return Err(error)
      users.push(user)
    }

    return Ok(users)
  }

  /**
   * Create empty user (for initial state)
   * Returns null to represent "no user"
   */
  static empty(): null {
    return null
  }

  // Getters

  getId(): EntityId {
    return this.id
  }

  getEmail(): Email {
    return this.email
  }

  getRole(): Role {
    return this.role
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }

  // Business logic methods

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.role.is(role)
  }

  /**
   * Check if user has role level equal or higher than specified role
   */
  hasRoleLevel(role: Role): boolean {
    return this.role.hasLevelOf(role)
  }

  /**
   * Check if user is Super Admin
   */
  isSuperAdmin(): boolean {
    return this.role.isSuperAdmin()
  }

  /**
   * Check if user is Admin or higher
   */
  isAdmin(): boolean {
    return this.role.isAdmin()
  }

  /**
   * Check if user can perform action requiring specific role
   */
  canPerform(requiredRole: Role): boolean {
    return this.role.canPerform(requiredRole)
  }

  /**
   * Check equality with another User
   */
  equals(other: User): boolean {
    return this.id.equals(other.id)
  }

  /**
   * Convert to plain object (for serialization)
   */
  toObject(): {
    createdAt: string
    email: string
    id: string
    role: string
    updatedAt: string
  } {
    return {
      createdAt: this.createdAt.toISOString(),
      email: this.email.getValue(),
      id: this.id.getValue(),
      role: this.role.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  /**
   * Convert to DTO (for API communication)
   */
  toDTO(): UserResponseDTO {
    return {
      createdAt: this.createdAt.toISOString(),
      email: this.email.getValue(),
      id: this.id.getValue(),
      role: this.role.getValue(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  /**
   * JSON serialization
   */
  toJSON() {
    return this.toObject()
  }
}
