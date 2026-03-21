// @ts-nocheck
// vitest 2.x uses vite 5 types internally; kept separate from vite.config.ts
// to avoid type conflicts when tsc-b runs on vite.config.ts (which uses vite 6)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/features/**', 'src/components/**'],
      thresholds: { lines: 70 },
    },
  },
})
