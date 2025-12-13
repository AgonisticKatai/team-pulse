import type { UserCreateInput, UserProps } from '@domain/models/user/User.types.js'
import type { UserResponseDTO } from '@team-pulse/shared'
import {
  combine,
  Err,
  IdUtils,
  Ok,
  type Result,
  UserEmail,
  UserId,
  UserRole,
  ValidationError,
} from '@team-pulse/shared'

export class User {
  readonly id: UserId
  readonly email: UserEmail
  readonly role: UserRole
  readonly createdAt: Date
  readonly updatedAt: Date
  private readonly passwordHash: string

  private constructor(props: UserProps) {
    this.id = props.id
    this.email = props.email
    this.role = props.role
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.passwordHash = props.passwordHash
  }

  static create(data: UserCreateInput): Result<User, ValidationError> {
    const results = combine({
      email: UserEmail.create(data.email),
      id: UserId.create(data.id),
      passwordHash: User.validatePasswordHash({ passwordHash: data.passwordHash }),
      role: UserRole.create(data.role),
    })

    if (!results.ok) return Err(results.error)

    return Ok(
      new User({
        createdAt: data.createdAt ?? new Date(),
        email: results.value.email,
        id: results.value.id,
        passwordHash: results.value.passwordHash,
        role: results.value.role,
        updatedAt: data.updatedAt ?? new Date(),
      }),
    )
  }

  protected static validatePasswordHash({ passwordHash }: { passwordHash: string }): Result<string, ValidationError> {
    if (!passwordHash || passwordHash.trim().length === 0)
      return Err(ValidationError.forField({ field: 'password', message: 'Password hash is required' }))
    return Ok(passwordHash)
  }

  getPasswordHash(): string {
    return this.passwordHash
  }

  update(data: UserUpdateInput): Result<User, ValidationError> {
    return User.create({
      createdAt: this.createdAt,
      email: data.email ?? this.email.getValue(),
      id: this.id.getValue(),
      passwordHash: data.passwordHash ?? this.passwordHash,
      role: data.role ?? this.role.getValue(),
      updatedAt: new Date(),
    })
  }

  toPrimitives(): UserPrimitives {
    return {
      createdAt: this.createdAt,
      email: this.email.getValue(),
      id: this.id,
      role: this.role.getValue(),
      updatedAt: this.updatedAt,
    }
  }
}
