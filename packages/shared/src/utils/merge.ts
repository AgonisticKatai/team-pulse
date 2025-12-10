/**
 * Merge an actual state with a partial update.
 */
export const merge = <T extends object>({ current, update }: { current: T; update: Partial<T> }): T => {
  const result = { ...current }

  // 1. Extract the keys and make a SAFE CAST.
  // It is safe because 'update' is Partial<T>, so its keys MUST be keyof T.
  const keys = Object.keys(update) as Array<keyof T>

  for (const key of keys) {
    const value = update[key]

    // 2. Business logic: Ignore undefined, apply nulls/values
    if (value !== undefined) {
      // We need final assertion because TS fears that value is undefined (although the if protects it)
      // or that the exact type of the key does not match (variance), but logically it is correct.
      result[key] = value as T[keyof T]
    }
  }

  return result
}
