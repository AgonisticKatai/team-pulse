import type { DomainError } from '../../../domain/errors'
import type { IAuthRepository } from '../../../domain/repositories'
import type { Result } from '../../../domain/types/Result'

/**
 * Logout Use Case
 * Orchestrates the logout flow
 */
export class LogoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute logout
   * Returns [error, null] or [null, true]
   */
  async execute(): Promise<Result<true, DomainError>> {
    // Call repository to logout
    const [error] = await this.authRepository.logout()

    if (error) {
      return [error, null]
    }

    return [null, true]
  }
}
