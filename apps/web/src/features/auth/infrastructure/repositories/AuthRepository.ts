import type { LoginResponseDTO, RefreshTokenResponseDTO, Result } from '@team-pulse/shared'
import type { IAuthRepository } from '@web/features/auth/domain/index.js'
import type { IHttpClient } from '@web/shared/infrastructure/http/IHttpClient.js'

/**
 * Auth Repository HTTP Adapter
 *
 * Implements IAuthRepository using HTTP client
 * Handles API communication for authentication operations
 */
export class AuthRepository implements IAuthRepository {
  private readonly httpClient: IHttpClient

  private constructor({ httpClient }: { httpClient: IHttpClient }) {
    this.httpClient = httpClient
  }

  static create({ httpClient }: { httpClient: IHttpClient }): AuthRepository {
    return new AuthRepository({ httpClient })
  }

  login(params: { email: string; password: string }): Promise<Result<LoginResponseDTO, Error>> {
    return this.httpClient.post<LoginResponseDTO>('/auth/login', params)
  }

  logout(): Promise<Result<void, Error>> {
    return this.httpClient.post<void>('/auth/logout')
  }

  refreshToken(params: { refreshToken: string }): Promise<Result<RefreshTokenResponseDTO, Error>> {
    return this.httpClient.post<RefreshTokenResponseDTO>('/auth/refresh', params)
  }

  verifySession(): Promise<Result<boolean, Error>> {
    return this.httpClient.get<boolean>('/auth/verify')
  }
}
