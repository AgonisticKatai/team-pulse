import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { USER_ROLES } from './UserRole.constants.js'
import type { UserRoleInput } from './UserRole.schema.js'
import { UserRoleSchema } from './UserRole.schema.js'
import type { UserRoleProps, UserRoleType } from './UserRole.types.js'

export class UserRole {
  readonly value: UserRoleType

  private constructor(value: UserRoleProps) {
    this.value = value
  }

  static create(input: UserRoleInput): Result<UserRole, ValidationError> {
    const validation = UserRoleSchema.safeParse(input)

    if (!validation.success) {
      return Err(
        ValidationError.fromZodError({
          error: validation.error,
        }),
      )
    }

    return Ok(new UserRole(validation.data))
  }

  equals(other: UserRole): boolean {
    return this.value === other.value
  }

  isAdmin(): boolean {
    return this.value === USER_ROLES.ADMIN
  }

  isGuest(): boolean {
    return this.value === USER_ROLES.GUEST
  }

  isSuperAdmin(): boolean {
    return this.value === USER_ROLES.SUPER_ADMIN
  }

  getValue(): UserRoleProps {
    return this.value
  }
}
