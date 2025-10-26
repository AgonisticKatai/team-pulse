import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// TypeScript declaration for jest-dom matchers
declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: Required for jest-dom matcher types
  interface Assertion<T = any> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
