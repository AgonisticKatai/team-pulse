import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@dtos': fileURLToPath(new URL('./src/dtos', import.meta.url)),
      '@errors': fileURLToPath(new URL('./src/errors', import.meta.url)),
      '@testing': fileURLToPath(new URL('./src/testing', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.d.ts', '**/types.ts'],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
