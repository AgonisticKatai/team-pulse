import type { LoginDTO, LoginResponseDTO, Result } from '@team-pulse/shared'
import type { IAuthRepository } from '@web/features/auth/domain/index.js'

/**
 * Login Use Case
 *
 * Orchestrates user authentication flow
 * Depends on IAuthRepository port (hexagonal architecture)
 */
export class LoginUseCase {
  private readonly authRepository: IAuthRepository

  private constructor({ authRepository }: { authRepository: IAuthRepository }) {
    this.authRepository = authRepository
  }

  static create({ authRepository }: { authRepository: IAuthRepository }): LoginUseCase {
    return new LoginUseCase({ authRepository })
  }

  async execute({ dto }: { dto: LoginDTO }): Promise<Result<LoginResponseDTO, Error>> {
    return await this.authRepository.login({ email: dto.email, password: dto.password })
  }
}
