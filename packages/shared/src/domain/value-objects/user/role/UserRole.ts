import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { USER_ROLES } from './UserRole.constants.js'
import { UserRoleSchema } from './UserRole.schema.js'
import type { UserRoleType } from './UserRole.types.js'

export class Role {
  private readonly value: UserRoleType

  private constructor({ value }: { value: UserRoleType }) {
    this.value = value
  }

  static create({ value }: { value: string }): Result<Role, ValidationError> {
    const validationResult = Role.validate({ value })

    if (!validationResult.ok) {
      return Err(
        ValidationError.invalidValue({
          field: 'role',
          message: validationResult.error.message,
          value,
        }),
      )
    }

    return Ok(new Role({ value: validationResult.value }))
  }

  static validate({ value }: { value: string }): Result<UserRoleType, ValidationError> {
    const result = UserRoleSchema.safeParse(value)

    if (!result.success) {
      return Err(
        ValidationError.fromZodError({
          error: result.error,
        }),
      )
    }

    return Ok(result.data)
  }

  getValue(): UserRoleType {
    return this.value
  }

  equals({ other }: { other: Role }): boolean {
    return this.value === other.value
  }

  isAdmin(): boolean {
    return this.value === USER_ROLES.Admin
  }

  isUser(): boolean {
    return this.value === USER_ROLES.User
  }

  isSuperAdmin(): boolean {
    return this.value === USER_ROLES.SuperAdmin
  }

  toString(): string {
    return this.value
  }
}
