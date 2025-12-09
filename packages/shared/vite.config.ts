import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        testing: resolve(__dirname, 'src/testing/index.ts'),
      },
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es'],
      name: 'TeamPulseShared',
    },
    rollupOptions: {
      external: ['zod', 'uuid', '@faker-js/faker', 'vitest'],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    sourcemap: true,
  },
  plugins: [tsconfigPaths(), dts({ insertTypesEntry: true, rollupTypes: true })],
})
