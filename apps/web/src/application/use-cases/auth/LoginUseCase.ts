import { Session } from '../../../domain/entities'
import type { DomainError } from '../../../domain/errors'
import type { IAuthRepository } from '../../../domain/repositories'
import { validateLoginCredentials } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'

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

    // Create session domain entity from login response
    const [sessionError, session] = Session.fromDTO({
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      user: loginResponse.user.toDTO(),
    })

    if (sessionError) {
      return Err(sessionError)
    }

    return [null, session]
  }
}
