import { expect } from 'vitest'

/**
 * Assert that a value is defined (not null or undefined) with TypeScript narrowing
 *
 * This helper provides type narrowing for TypeScript after checking that a value is defined.
 * Useful when destructuring arrays where TypeScript can't infer the element exists.
 *
 * @example
 * const tokens = expectSuccess(result)
 * expect(tokens).toHaveLength(1)
 * const [firstToken] = tokens
 * assertDefined(firstToken) // TypeScript now knows firstToken is defined
 * expect(firstToken.userId.getValue()).toBe('user-1')
 *
 * @param value - The value to check
 * @param message - Optional custom error message
 */
export function assertDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
  expect(value, message).toBeDefined()
}
