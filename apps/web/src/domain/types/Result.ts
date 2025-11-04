/**
 * Result type for inline error handling
 * Inspired by Go's error handling pattern: [error, data]
 *
 * @example
 * const [error, user] = User.create(data)
 * if (error) {
 *   // handle error
 *   return
 * }
 * // use user safely
 */
export type Result<T, E = Error> = [null, T] | [E, null]

/**
 * Success result helper
 */
export const Ok = <T>(data: T): Result<T, never> => [null, data]

/**
 * Error result helper
 */
export const Err = <E extends Error>(error: E): Result<never, E> => [error, null]

/**
 * Type guard to check if result is an error
 */
export const isError = <T, E extends Error>(result: Result<T, E>): result is [E, null] =>
  result[0] !== null

/**
 * Type guard to check if result is successful
 */
export const isOk = <T, E extends Error>(result: Result<T, E>): result is [null, T] =>
  result[0] === null

/**
 * Unwrap result or throw error
 * Use only when you're certain the result is Ok
 */
export const unwrap = <T, E extends Error>(result: Result<T, E>): T => {
  if (isError(result)) {
    throw result[0]
  }
  return result[1]
}

/**
 * Unwrap result or return default value
 */
export const unwrapOr = <T, E extends Error>(result: Result<T, E>, defaultValue: T): T => {
  if (isError(result)) {
    return defaultValue
  }
  return result[1]
}

/**
 * Map result value if Ok
 */
export const map = <T, U, E extends Error>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => {
  if (isError(result)) {
    return result
  }
  return Ok(fn(result[1]))
}

/**
 * FlatMap for chaining Result-returning operations
 */
export const flatMap = <T, U, E extends Error>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => {
  if (isError(result)) {
    return result
  }
  return fn(result[1])
}
