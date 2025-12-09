import { v4 as uuid, validate as uuidValidate } from 'uuid'
import type { EntityId } from './EntityId.js'

export const IdUtils = {
  generate: <T extends EntityId<string>>(): T => uuid() as T,

  isValid: (value: string): boolean => uuidValidate(value),

  toId: <T extends EntityId<string>>(value: string): T => {
    if (!IdUtils.isValid(value)) {
      throw new Error(`Invalid ID format: ${value}`)
    }
    return value as T
  },
}
