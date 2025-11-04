import type { Session } from '../../../domain/entities'
import type { DomainError } from '../../../domain/errors'
import type { IAuthRepository } from '../../../domain/repositories'
import { validateLoginCredentials } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'
import { sessionToDomain } from '../../mappers'

/**
 * Login Use Case input
 */
export interface LoginUseCaseInput {
  email: string
  password: string
}

/**
 * Login Use Case
 * Orchestrates the login flow
 */
export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute login
   * Returns [error, null] or [null, session]
   */
  async execute(input: LoginUseCaseInput): Promise<Result<Session, DomainError>> {
    // Validate credentials using domain service
    const [validationError, credentials] = validateLoginCredentials(input.email, input.password)

    if (validationError) {
      return Err(validationError)
    }

    // Call repository to login
    const [loginError, loginResponse] = await this.authRepository.login({
      email: credentials.email.getValue(),
      password: credentials.password,
    })

    if (loginError) {
      return Err(loginError)
    }

    // Map response to session domain entity
    const [mapError, session] = sessionToDomain({
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      user: {
        createdAt: loginResponse.user.getCreatedAt().toISOString(),
        email: loginResponse.user.getEmail().getValue(),
        id: loginResponse.user.getId().getValue(),
        role: loginResponse.user.getRole().getValue(),
        updatedAt: loginResponse.user.getUpdatedAt().toISOString(),
      },
    })

    if (mapError) {
      return Err(mapError)
    }

    return [null, session]
  }
}
