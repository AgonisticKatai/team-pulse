/**
 * Result type for type-safe error handling
 * Inspired by Rust's Result<T, E> with discriminated unions
 *
 * Uses a discriminated union that TypeScript can narrow automatically.
 * This eliminates the need for non-null assertions (!).
 *
 * @example
 * const result = User.create(data)
 * if (!result.ok) {
 *   // TypeScript knows result.error exists here
 *   return result.error
 * }
 * // TypeScript knows result.value exists here (no ! needed)
 * const user = result.value
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

/**
 * Success result helper
 *
 * @example
 * return Ok(user)
 */
export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value })

/**
 * Error result helper
 *
 * @example
 * return Err(new ValidationError('Invalid input'))
 */
export const Err = <E extends Error>(error: E): Result<never, E> => ({ error, ok: false })

/**
 * Type guard to check if result is an error
 *
 * @example
 * if (isError(result)) {
 *   console.log(result.error.message)
 * }
 */
export const isError = <T, E extends Error>(result: Result<T, E>): result is { ok: false; error: E } => !result.ok

/**
 * Type guard to check if result is successful
 *
 * @example
 * if (isOk(result)) {
 *   console.log(result.value)
 * }
 */
export const isOk = <T, E extends Error>(result: Result<T, E>): result is { ok: true; value: T } => result.ok

/**
 * Unwrap result or throw error
 * Use only when you're certain the result is Ok
 *
 * @example
 * const user = unwrap(User.create(data))
 */
export const unwrap = <T, E extends Error>(result: Result<T, E>): T => {
  if (!result.ok) {
    throw result.error
  }
  return result.value
}

/**
 * Unwrap result or return default value
 *
 * @example
 * const user = unwrapOr(User.create(data), defaultUser)
 */
export const unwrapOr = <T, E extends Error>(result: Result<T, E>, defaultValue: T): T => {
  if (!result.ok) {
    return defaultValue
  }
  return result.value
}

/**
 * Map result value if Ok
 *
 * @example
 * const upperName = map(result, user => user.name.toUpperCase())
 */
export const map = <T, U, E extends Error>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  if (!result.ok) {
    return result
  }
  return Ok(fn(result.value))
}

/**
 * FlatMap for chaining Result-returning operations
 *
 * @example
 * const result = flatMap(userResult, user => validateUser(user))
 */
export const flatMap = <T, U, E extends Error>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
  if (!result.ok) {
    return result
  }
  return fn(result.value)
}

/**
 * Collect an array of Results into a Result of array
 * If any Result is an error, returns the first error found
 * Otherwise returns Ok with array of all values
 *
 * This is known as "sequence" in functional programming
 *
 * @example
 * const results = users.map(u => User.create(u))
 * const collected = collect(results) // Result<User[], ValidationError>
 */
export const collect = <T, E extends Error>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = []
  for (const result of results) {
    if (!result.ok) {
      return result
    }
    values.push(result.value)
  }
  return Ok(values)
}

/**
 * Combine an object of Results into a Result of object
 * Similar to Promise.all but for Results and keys
 */
type ExtractValue<T> = T extends Result<infer V, unknown> ? V : never
type ExtractError<T> = T extends Result<unknown, infer E> ? E : never

export const combine = <T extends Record<string, Result<unknown, unknown>>>(
  results: T,
): Result<{ [K in keyof T]: ExtractValue<T[K]> }, ExtractError<T[keyof T]>> => {
  const values: Record<string, unknown> = {}

  for (const [key, result] of Object.entries(results)) {
    if (!result.ok) {
      return result as Result<never, ExtractError<T[keyof T]>>
    }
    values[key] = result.value
  }

  return Ok(values as { [K in keyof T]: ExtractValue<T[K]> })
}
