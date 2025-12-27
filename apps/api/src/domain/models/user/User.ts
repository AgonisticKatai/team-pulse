import type { UserCreateInput, UserPrimitives, UserProps, UserUpdateInput } from '@domain/models/user/User.types.js'
import type { Result } from '@team-pulse/shared'
import { combine, Err, merge, Ok, UserEmail, UserId, UserRole, ValidationError } from '@team-pulse/shared'

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

  static create(input: UserCreateInput): Result<User, ValidationError> {
    const results = combine({
      email: UserEmail.create(input.email),
      id: UserId.create(input.id),
      passwordHash: User.validatePasswordHash({ passwordHash: input.passwordHash }),
      role: UserRole.create(input.role),
    })

    if (!results.ok) {
      return Err(results.error)
    }

    return Ok(
      new User({
        createdAt: input.createdAt ?? new Date(),
        email: results.value.email,
        id: results.value.id,
        passwordHash: results.value.passwordHash,
        role: results.value.role,
        updatedAt: input.updatedAt ?? new Date(),
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
    const updatedProps = merge({ current: this.toPrimitives(), update: data })

    return User.create({
      ...updatedProps,
      createdAt: this.createdAt,
      id: this.id,
      passwordHash: data.passwordHash ?? this.passwordHash,
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
