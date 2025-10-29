import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // Test containers provide isolated PostgreSQL instances per test suite
    // This enables parallel execution with true test isolation
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.d.ts', '**/types.ts'],
    },
    include: ['src/**/*.{test,spec}.ts'],
  },
})
