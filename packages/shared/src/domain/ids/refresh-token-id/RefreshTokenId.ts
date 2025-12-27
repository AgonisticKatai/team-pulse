import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type EntityId } from '../EntityId.js'
import { IdUtils } from '../EntityId.utils.js'
import { REFRESH_TOKEN_ID_BRAND, REFRESH_TOKEN_ID_VALIDATION_ERROR } from './RefreshTokenId.constants.js'

export type RefreshTokenId = EntityId<typeof REFRESH_TOKEN_ID_BRAND>

export const RefreshTokenId = {
  create: (id: string): Result<RefreshTokenId, ValidationError> => {
    if (!IdUtils.isValid(id)) {
      return Err(
        ValidationError.create({
          message: REFRESH_TOKEN_ID_VALIDATION_ERROR,
          metadata: { field: REFRESH_TOKEN_ID_BRAND, value: id },
        }),
      )
    }
    return Ok(id as RefreshTokenId)
  },

  random: (): RefreshTokenId => {
    return IdUtils.generate() as RefreshTokenId
  },
}
