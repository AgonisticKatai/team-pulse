import { expect } from 'vitest'
import type { Result } from '../../domain/types/index.js'

/**
 * Test helper to assert a Result is successful and extract the value type-safely
 *
 * With the discriminated union Result type, TypeScript automatically narrows the type
 * after checking result.ok, eliminating the need for non-null assertions (!)
 *
 * @example
 * // Before (tuple):
 * const [error, team] = await useCase.execute(dto)
 * expect(error).toBeNull()
 * expect(team!.id).toBe('123') // ← needs !
 *
 * // After (discriminated union):
 * const team = expectSuccess(await useCase.execute(dto))
 * expect(team.id).toBe('123') // ← no ! needed, TypeScript knows team is T
 */
export function expectSuccess<T, E>(result: Result<T, E>): T {
  expect(result.ok).toBe(true)

  // This check is for runtime safety (helps TypeScript narrow the type)
  if (!result.ok) {
    throw new Error(`Expected Ok result, got error: ${result.error}`)
  }

  // TypeScript now AUTOMATICALLY knows result.value is T (no casting needed!)
  return result.value
}

/**
 * Test helper to assert a Result is an error and extract the error type-safely
 *
 * With the discriminated union Result type, TypeScript automatically narrows the type
 * after checking !result.ok, eliminating the need for non-null assertions (!)
 *
 * @example
 * // Before (tuple):
 * const [error, team] = await useCase.execute(dto)
 * expect(error).toBeInstanceOf(ValidationError)
 * expect(error!.message).toBe('Invalid') // ← needs !
 *
 * // After (discriminated union):
 * const error = expectError(await useCase.execute(dto))
 * expect(error).toBeInstanceOf(ValidationError)
 * expect(error.message).toBe('Invalid') // ← no ! needed, TypeScript knows error is E
 */
export function expectError<T, E>(result: Result<T, E>): E {
  expect(result.ok).toBe(false)

  // This check is for runtime safety (helps TypeScript narrow the type)
  if (result.ok) {
    throw new Error(`Expected Err result, got value: ${result.value}`)
  }

  // TypeScript now AUTOMATICALLY knows result.error is E (no casting needed!)
  return result.error
}

/**
 * Test helper to assert a Result is successful and the value is defined
 *
 * Similar to expectSuccess but also checks that value is defined (not just non-null)
 */
export function expectDefined<T, E>(result: Result<T, E>): NonNullable<T> {
  const value = expectSuccess(result)
  expect(value).toBeDefined()
  return value as NonNullable<T>
}

/**
 * Test helper to assert a Result contains a specific error type
 *
 * This helper allows type-safe extraction of specific error types from union types.
 * It automatically narrows the error type using instanceof check.
 * Works with both public and private constructors.
 *
 * @example
 * const error = expectErrorType({ result, errorType: ValidationError })
 * expect(error.field).toBe('name') // ← TypeScript knows error is ValidationError
 */
export function expectErrorType<E extends Error>({ result, errorType }: { result: Result<any, any>; errorType: Function & { prototype: E } }): E {
  const error = expectError(result)
  expect(error).toBeInstanceOf(errorType)
  return error as E
}

/**
 * Test helper to assert a Result contains an array with exactly one element
 *
 * This helper combines expectSuccess, length assertion, and element extraction
 * into a single, type-safe operation. Perfect for repository queries that should
 * return a single result.
 *
 * @example
 * // Before:
 * const tokens = expectSuccess(result)
 * expect(tokens).toHaveLength(1)
 * const [firstToken] = tokens
 * assertDefined(firstToken)
 * expect(firstToken.userId).toBe('user-1')
 *
 * // After:
 * const token = expectSingle(result)
 * expect(token.userId).toBe('user-1')
 */
export function expectSingle<T, E>(result: Result<T[], E>): T {
  const array = expectSuccess(result)
  expect(array).toHaveLength(1)
  const [first] = array
  expect(first).toBeDefined()
  return first as T
}

/**
 * Test helper to assert a Result contains a non-empty array and return the first element
 *
 * This helper extracts the first element of an array result with proper type safety.
 * Use this when you need to assert properties of the first item in a list.
 *
 * @example
 * // Before:
 * const teams = expectSuccess(result)
 * expect(teams[0]?.name).toBe('FC Barcelona')
 *
 * // After:
 * const teams = expectSuccess(result)
 * const firstTeam = expectFirst(teams)
 * expect(firstTeam.name).toBe('FC Barcelona')
 */
export function expectFirst<T>(array: T[]): T {
  expect(array.length).toBeGreaterThan(0)
  const [first] = array
  expect(first).toBeDefined()
  return first as T
}

/**
 * Test helper to assert a Result contains an array of specific length
 *
 * This helper combines expectSuccess with a length assertion, returning the
 * type-safe array for further assertions.
 *
 * @example
 * // Before:
 * const teams = expectSuccess(result)
 * expect(teams).toHaveLength(3)
 *
 * // After:
 * const teams = expectArrayOfLength(result, 3)
 */
export function expectArrayOfLength<T, E>(result: Result<T[], E>, length: number): T[] {
  const array = expectSuccess(result)
  expect(array).toHaveLength(length)
  return array
}
