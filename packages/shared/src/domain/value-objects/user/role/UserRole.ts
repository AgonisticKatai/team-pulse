import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { USER_ROLES } from './UserRole.constants.js'
import type { UserRoleInput } from './UserRole.schema.js'
import { UserRoleSchema } from './UserRole.schema.js'
import type { UserRoleName, UserRoleProps } from './UserRole.types.js'

export class UserRole {
  readonly name: UserRoleName

  private constructor(props: UserRoleProps) {
    this.name = props.name
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

  equals({ other }: { other: UserRole }): boolean {
    return this.name === other.name
  }

  isAdmin(): boolean {
    return this.name === USER_ROLES.ADMIN
  }

  isGuest(): boolean {
    return this.name === USER_ROLES.GUEST
  }

  isSuperAdmin(): boolean {
    return this.name === USER_ROLES.SUPER_ADMIN
  }

  getValue(): UserRoleProps {
    return { name: this.name }
  }
}
