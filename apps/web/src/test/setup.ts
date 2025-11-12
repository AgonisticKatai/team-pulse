import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect } from 'vitest'
import { setupLocalStorageMock } from './mocks/local-storage'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// TypeScript declaration for jest-dom matchers
declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: Required for jest-dom matcher types
  interface Assertion<T = any> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
}

// Setup browser APIs mocks
const localStorageMock = setupLocalStorageMock()

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})
