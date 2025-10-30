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
