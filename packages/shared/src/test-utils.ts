import { expect } from 'vitest'
import type { z } from 'zod'

/**
 * Test utilities for the shared package
 */

/**
 * Type-safe helper to validate Zod schema errors
 *
 * This helper properly handles TypeScript's `noUncheckedIndexedAccess` config
 * by explicitly checking that issues array has elements before accessing them.
 *
 * @param result - The result from a Zod schema.safeParse() call
 * @param expectedMessage - The expected error message from the first issue
 *
 * @example
 * ```typescript
 * const result = LoginDTOSchema.safeParse({ email: 'invalid' })
 * expectZodError(result, 'Invalid email format')
 * ```
 */
export function expectZodError(
  result: { success: boolean; error?: z.ZodError },
  expectedMessage: string,
): void {
  expect(result.success).toBe(false)

  if (!result.success && result.error) {
    // Verify that Zod generated at least one issue
    expect(result.error.issues.length).toBeGreaterThan(0)

    // Get first issue (safe because we verified length > 0)
    const firstIssue = result.error.issues[0]
    expect(firstIssue).toBeDefined()
    expect(firstIssue?.message).toBe(expectedMessage)
  }
}

/**
 * Type-safe helper to get an argument from a mock function call
 *
 * This helper properly handles TypeScript's `noUncheckedIndexedAccess` config
 * by explicitly checking that the call and argument exist before returning them.
 *
 * @param mockFn - The mocked function (typically from vi.mocked())
 * @param callIndex - The index of the call to check (0-based, defaults to 0)
 * @param argIndex - The index of the argument to retrieve (0-based, defaults to 0)
 * @returns The argument value, properly typed
 *
 * @example
 * ```typescript
 * // Get first argument of first call (most common case)
 * const savedUser = expectMockCallArg<User>(vi.mocked(userRepository.save))
 * expect(savedUser.id).toBe('user-123')
 *
 * // Get second argument of first call
 * const config = expectMockCallArg<Config>(vi.mocked(someFunction), 0, 1)
 *
 * // Get first argument of second call
 * const secondUser = expectMockCallArg<User>(vi.mocked(userRepository.save), 1)
 * ```
 */
export function expectMockCallArg<T>(
  mockFn: { mock: { calls: unknown[][] } },
  callIndex = 0,
  argIndex = 0,
): T {
  const call = mockFn.mock.calls[callIndex]
  expect(call).toBeDefined()

  const arg = call?.[argIndex]
  expect(arg).toBeDefined()

  return arg as T
}
