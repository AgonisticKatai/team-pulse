import type { Result } from '@team-pulse/shared'
import { combine, Err, Ok, RefreshTokenId, UserId, ValidationError } from '@team-pulse/shared'
import type { RefreshTokenCreateInput, RefreshTokenPrimitives, RefreshTokenProps } from './RefreshToken.types.js'

export class RefreshToken {
  readonly id: RefreshTokenId
  readonly token: string
  readonly userId: UserId
  readonly expiresAt: Date
  readonly createdAt: Date

  private constructor(props: RefreshTokenProps) {
    this.id = props.id
    this.token = props.token
    this.userId = props.userId
    this.expiresAt = props.expiresAt
    this.createdAt = props.createdAt
  }

  static create(input: RefreshTokenCreateInput): Result<RefreshToken, ValidationError> {
    // Validate token is not empty
    if (!input.token || input.token.trim().length === 0) {
      return Err(ValidationError.forField({ field: 'token', message: 'Refresh token cannot be empty' }))
    }

    const results = combine({
      id: RefreshTokenId.create(input.id),
      userId: UserId.create(input.userId),
    })

    if (!results.ok) {
      return Err(results.error)
    }

    return Ok(
      new RefreshToken({
        createdAt: input.createdAt ?? new Date(),
        expiresAt: input.expiresAt,
        id: results.value.id,
        token: input.token,
        userId: results.value.userId,
      }),
    )
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt
  }

  isValid(): boolean {
    return !this.isExpired()
  }

  toPrimitives(): RefreshTokenPrimitives {
    return {
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      id: this.id,
      token: this.token,
      userId: this.userId,
    }
  }
}
