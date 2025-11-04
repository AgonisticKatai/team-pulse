import type { DomainError } from '../../../domain/errors'
import type { IAuthRepository } from '../../../domain/repositories'
import type { Result } from '../../../domain/types/Result'

/**
 * Refresh Token Use Case
 * Orchestrates the token refresh flow
 */
export class RefreshTokenUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Execute token refresh
   * Returns [error, null] or [null, { accessToken }]
   */
  async execute(refreshToken: string): Promise<Result<{ accessToken: string }, DomainError>> {
    // Call repository to refresh token
    const [error, response] = await this.authRepository.refreshToken(refreshToken)

    if (error) {
      return [error, null]
    }

    return [null, response]
  }
}
