import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@dtos': fileURLToPath(new URL('./src/dtos', import.meta.url)),
      '@errors': fileURLToPath(new URL('./src/errors', import.meta.url)),
      '@result': fileURLToPath(new URL('./src/types/Result', import.meta.url)),
      '@testing': fileURLToPath(new URL('./src/testing', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@value-objects': fileURLToPath(new URL('./src/domain/value-objects', import.meta.url)),
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
