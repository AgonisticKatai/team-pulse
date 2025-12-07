import { ValidationError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import { UserRoles } from './Role.constants.js'
import { roleSchema } from './Role.schema.js'
import type { UserRoleType } from './Role.types.js'

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
    const result = roleSchema.safeParse(value)

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
    return this.value === UserRoles.Admin
  }

  isUser(): boolean {
    return this.value === UserRoles.User
  }

  isSuperAdmin(): boolean {
    return this.value === UserRoles.SuperAdmin
  }

  toString(): string {
    return this.value
  }
}
