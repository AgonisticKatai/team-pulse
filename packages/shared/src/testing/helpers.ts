import type { Result } from '@result'
import { expect } from 'vitest'

/**
 * Testing Helpers
 *
 * Centralized collection of all testing utilities for assertion and validation.
 * These helpers provide type-safe operations for common testing patterns,
 * eliminating the need for 'as any', '!', or '?' in your tests.
 */

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a value is defined (not null or undefined) with TypeScript narrowing
 *
 * This helper provides type narrowing for TypeScript after checking that a value is defined.
 * Useful when destructuring arrays where TypeScript can't infer the element exists.
 *
 * @example
 * const tokens = expectSuccess(result)
 * const [firstToken] = tokens
 * assertDefined(firstToken) // TypeScript now knows firstToken is defined
 * expect(firstToken.userId).toBe('user-1')
 */
export function assertDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
  expect(value, message).toBeDefined()
  expect(value, message).not.toBeNull()
}

// ============================================================================
// RESULT PATTERN HELPERS
// ============================================================================

/**
 * Test helper to assert a Result is successful and extract the value type-safely
 *
 * With the discriminated union Result type, TypeScript automatically narrows the type
 * after checking result.ok, eliminating the need for non-null assertions (!).
 *
 * @example
 * const team = expectSuccess(await useCase.execute(dto))
 * expect(team.id).toBe('123') // TypeScript knows team is T
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
 * @example
 * const error = expectError(await useCase.execute(dto))
 * expect(error.message).toBe('Invalid') // TypeScript knows error is E
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
 * Test helper to assert a Result is successful and the value is STRICTLY defined
 *
 * Similar to expectSuccess but also checks that value is not null/undefined.
 * Use this when the success value implies an object/value presence.
 */
export function expectDefined<T, E>(result: Result<T, E>): NonNullable<T> {
  const value = expectSuccess(result)
  expect(value).toBeDefined()
  expect(value).not.toBeNull()
  return value as NonNullable<T>
}

/**
 * Test helper to assert a Result contains a specific error type (Class Instance)
 *
 * Automatically narrows the error type using instanceof check.
 *
 * @example
 * const error = expectErrorType({ result, errorType: ValidationError })
 * expect(error.field).toBe('name')
 */
export function expectErrorType<E extends Error>({
  result,
  errorType,
}: {
  result: Result<unknown, unknown>
  // biome-ignore lint/complexity/noBannedTypes: Needed for constructor type inference
  errorType: Function & { prototype: E }
}): E {
  const error = expectError(result)
  expect(error).toBeInstanceOf(errorType)
  return error as E
}

/**
 * Test helper to assert a Result contains an array with EXACTLY one element
 * Returns that single element.
 */
export function expectSingle<T, E>(result: Result<T[], E>): T {
  const array = expectSuccess(result)
  expect(array).toHaveLength(1)
  const [first] = array
  assertDefined(first, 'Expected single element to be defined')
  return first
}

/**
 * Test helper to assert a Result contains a non-empty array and return the first element
 */
export function expectFirst<T>(array: T[]): T {
  expect(array.length).toBeGreaterThan(0)
  const [first] = array
  assertDefined(first, 'Expected first element to be defined')
  return first
}

/**
 * Test helper to assert a Result contains an array of specific length
 */
export function expectArrayOfLength<T, E>(result: Result<T[], E>, length: number): T[] {
  const array = expectSuccess(result)
  expect(array).toHaveLength(length)
  return array
}

// ============================================================================
// MOCK HELPERS
// ============================================================================

/**
 * Type-safe helper to get an argument from a mock function call
 *
 * Checks array length instead of value truthiness.
 * This allows safe testing of calls where 'null' is a valid argument.
 *
 * @param mockFn - The mocked function (typically from vi.mocked())
 * @param callIndex - The index of the call to check (0-based, defaults to 0)
 * @param argIndex - The index of the argument to retrieve (0-based, defaults to 0)
 */

export function expectMockCallArg<T>(mockFn: { mock: { calls: unknown[][] } }, callIndex = 0, argIndex = 0): T {
  const calls = mockFn.mock.calls

  // 1. Verify the function was actually called enough times
  expect(
    calls.length,
    `Expected mock to be called at least ${callIndex + 1} times, but was called ${calls.length} times`,
  ).toBeGreaterThan(callIndex)

  const args = calls[callIndex]

  // 2. SAFETY CHECK & NARROWING:
  // We use our helper to tell TypeScript: "If we pass this line, args is defined".
  // This satisfies the linter and removes the need for '!' later.
  assertDefined(args, `Mock call #${callIndex} arguments structure is undefined`)

  // Now TypeScript knows 'args' is 'unknown[]' (not undefined)
  expect(args.length, `Expected mock call #${callIndex} to have at least ${argIndex + 1} arguments`).toBeGreaterThan(
    argIndex,
  )

  // 3. Return the argument
  // No '!' needed because TS knows 'args' exists.
  return args[argIndex] as T
}

/**
 * Type-safe helper to get the invocation order of a mock function call
 */
export function expectMockInvocationOrder(mockFn: { mock: { invocationCallOrder: number[] } }, callIndex = 0): number {
  const order = mockFn.mock.invocationCallOrder[callIndex]
  expect(order).toBeDefined()
  return order as number
}

// ============================================================================
// ZOD VALIDATION HELPERS
// ============================================================================

/**
 * Type-safe helper to validate Zod schema errors
 */
export function expectZodError(
  result: { success: boolean; error?: { issues: Array<{ message: string }> } },
  expectedMessage: string,
): void {
  expect(result.success).toBe(false)

  if (!result.success && result.error) {
    expect(result.error.issues.length).toBeGreaterThan(0)
    const firstIssue = result.error.issues[0]
    expect(firstIssue).toBeDefined()
    expect(firstIssue?.message).toBe(expectedMessage)
  }
}
