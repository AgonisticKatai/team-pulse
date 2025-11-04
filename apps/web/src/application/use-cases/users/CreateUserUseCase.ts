import type { User } from '../../../domain/entities'
import { type DomainError, ValidationError } from '../../../domain/errors'
import type { IUserRepository } from '../../../domain/repositories'
import { canCreateUser, validateRegistrationCredentials } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'
import { Role } from '../../../domain/value-objects'

/**
 * Create User Use Case input
 */
export interface CreateUserUseCaseInput {
  email: string
  password: string
  role: string
}

/**
 * Create User Use Case
 * Orchestrates user creation
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute create user
   * Returns [error, null] or [null, user]
   */
  async execute(
    input: CreateUserUseCaseInput,
    currentUser: User | null,
  ): Promise<Result<User, DomainError>> {
    // Check permissions
    const [permissionError] = canCreateUser(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Validate credentials using domain service
    const [validationError, credentials] = validateRegistrationCredentials(
      input.email,
      input.password,
    )

    if (validationError) {
      return Err(validationError)
    }

    // Validate role
    const [roleError] = Role.create(input.role)
    if (roleError) {
      return Err(roleError)
    }

    // Check if user with email already exists
    const [findError, existingUser] = await this.userRepository.findByEmail(
      credentials.email.getValue(),
    )
    if (findError) {
      return Err(findError)
    }

    if (existingUser) {
      return Err(
        ValidationError.forField(
          'email',
          `User with email '${credentials.email.getValue()}' already exists`,
        ),
      )
    }

    // Create user via repository
    const [createError, user] = await this.userRepository.create({
      email: credentials.email.getValue(),
      password: credentials.password,
      role: input.role,
    })

    if (createError) {
      return Err(createError)
    }

    return [null, user]
  }
}
