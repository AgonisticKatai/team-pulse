import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@application': fileURLToPath(new URL('./src/application', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
    },
  },
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
