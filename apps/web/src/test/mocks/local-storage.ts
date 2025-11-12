import { vi } from 'vitest'

/**
 * Mock implementation of localStorage for testing
 * Provides a working localStorage implementation when happy-dom doesn't provide one
 */
export const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    clear: () => {
      store = {}
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    setItem: (key: string, value: string) => {
      store[key] = value
    },
  }
}

/**
 * Setup localStorage mock for tests
 */
export const setupLocalStorageMock = () => {
  const localStorageMock = createLocalStorageMock()
  vi.stubGlobal('localStorage', localStorageMock)
  return localStorageMock
}
