import { v4 as uuid, validate as uuidValidate } from 'uuid'

export const IdUtils = {
  generate: (): string => uuid(),
  isValid: ({ id }: { id: string }): boolean => uuidValidate(id),
}
