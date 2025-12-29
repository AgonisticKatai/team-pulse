import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@web': path.resolve(__dirname, './src'),
      '@web/core': path.resolve(__dirname, './src/core'),
      '@web/features': path.resolve(__dirname, './src/features'),
      '@web/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  test: {
    coverage: {
      exclude: ['node_modules/', 'dist/', '**/*.config.ts', '**/*.d.ts', '**/types.ts', 'src/test/'],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
