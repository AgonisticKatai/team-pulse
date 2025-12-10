import { type EntityId, IdUtils } from '@domain/ids'
import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { TEAM_ID_BRAND, TEAM_ID_VALIDATION_ERROR } from './TeamId.constants'

export type TeamId = EntityId<typeof TEAM_ID_BRAND>

export const TeamId = {
  create: ({ id }: { id: string }): Result<TeamId, ValidationError> => {
    if (!IdUtils.isValid({ id })) {
      return Err(
        ValidationError.create({
          message: TEAM_ID_VALIDATION_ERROR,
          metadata: { field: TEAM_ID_BRAND, value: id },
        }),
      )
    }
    return Ok(id as TeamId)
  },

  random: (): TeamId => {
    return IdUtils.generate() as TeamId
  },
}
