import type { LoginResponseDTO } from '@team-pulse/shared'
import { Session } from '../../domain/entities'
import { ValidationError } from '../../domain/errors'
import type { Result } from '../../domain/types/Result'
import { Err } from '../../domain/types/Result'
import { userToDomain, userToDTO } from './UserMapper'

/**
 * Session Mapper
 * Converts between DTOs and Domain Entities
 */

/**
 * Map Login Response DTO to Session Domain Entity
 * Returns [error, null] or [null, session]
 */
export function sessionToDomain(dto: LoginResponseDTO): Result<Session, ValidationError> {
  // Map user DTO to domain
  const [userError, user] = userToDomain(dto.user)
  if (userError) {
    return Err(
      new ValidationError(`Failed to map Session DTO: ${userError.message}`, {
        details: { dto, originalError: userError.toObject() },
      }),
    )
  }

  // Create session
  const [sessionError, session] = Session.create({
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    user,
  })

  if (sessionError) {
    return Err(
      new ValidationError(`Failed to map Session DTO to domain: ${sessionError.message}`, {
        details: { dto, originalError: sessionError.toObject() },
      }),
    )
  }

  return [null, session]
}

/**
 * Map Domain Entity to storage object
 * This is used when we need to persist session to localStorage
 */
export function sessionToStorage(session: Session): {
  accessToken: string
  refreshToken: string
  user: ReturnType<typeof userToDTO>
} {
  return {
    accessToken: session.getAccessToken(),
    refreshToken: session.getRefreshToken(),
    user: userToDTO(session.getUser()),
  }
}

/**
 * Map storage object to Domain Entity
 * Returns [error, null] or [null, session]
 */
export function sessionFromStorage(data: {
  accessToken: string
  refreshToken: string
  user: ReturnType<typeof userToDTO>
}): Result<Session, ValidationError> {
  // Map user to domain
  const [userError, user] = userToDomain(data.user)
  if (userError) {
    return Err(
      new ValidationError(`Failed to restore Session from storage: ${userError.message}`, {
        details: { originalError: userError.toObject() },
      }),
    )
  }

  // Create session
  const [sessionError, session] = Session.create({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user,
  })

  if (sessionError) {
    return Err(
      new ValidationError(`Failed to restore Session from storage: ${sessionError.message}`, {
        details: { originalError: sessionError.toObject() },
      }),
    )
  }

  return [null, session]
}
