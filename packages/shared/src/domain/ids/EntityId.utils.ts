import { v4 as uuid, validate as uuidValidate } from 'uuid'

export const IdUtils = {
  generate: (): string => uuid(),
  isValid: (id: string): boolean => uuidValidate(id),
  toId: <T extends string>(id: string): T => id as T,
}
