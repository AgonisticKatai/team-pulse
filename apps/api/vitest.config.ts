import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Default to SQLite in-memory for local tests
      // CI will override this with PostgreSQL URL
      DATABASE_URL: process.env.DATABASE_URL || ':memory:',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.d.ts', '**/types.ts'],
    },
    include: ['src/**/*.{test,spec}.ts'],
  },
})
