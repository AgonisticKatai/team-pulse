import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test containers provide isolated PostgreSQL instances per test suite
    // This enables parallel execution with true test isolation
    coverage: {
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.d.ts', '**/types.ts'],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
})
