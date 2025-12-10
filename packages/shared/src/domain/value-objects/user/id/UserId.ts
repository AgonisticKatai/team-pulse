import { type EntityId, IdUtils } from '@domain/ids'
import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { USER_ID_BRAND, USER_ID_VALIDATION_ERROR } from './UserId.constants'

export type UserId = EntityId<typeof USER_ID_BRAND>

export const UserId = {
  create: ({ id }: { id: string }): Result<UserId, ValidationError> => {
    if (!IdUtils.isValid({ id })) {
      return Err(
        ValidationError.create({
          message: USER_ID_VALIDATION_ERROR,
          metadata: { field: USER_ID_BRAND, value: id },
        }),
      )
    }
    return Ok(id as UserId)
  },

  random: (): UserId => {
    return IdUtils.generate() as UserId
  },
}
