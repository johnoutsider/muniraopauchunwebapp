import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * Vitest konfiguratsiyasi (PLAN.md 1.4 — Test: Vitest + Testing Library).
 *
 * - `@/` aliasi tsconfig'dagi bilan bir xil (`./src`), `@root/` — repo ildizi.
 * - Muhit: jsdom — komponent testlari (Testing Library) uchun; toza funksiya
 *   testlari (adaptiv dvigatel, statistika) jsdom'da ham xuddi shunday ishlaydi.
 * - Firebase emulator testlari (`tests/rules/`) va Playwright e2e (`tests/e2e/`)
 *   bu yerdan chiqarib tashlangan — ular alohida buyruq bilan ishga tushadi.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@root': rootDir,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(rootDir, 'tests/setup.ts')],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/functions/**',
      'tests/e2e/**',
      'tests/rules/**',
    ],
    reporters: ['default'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/firebase/**', 'src/lib/i18n/**'],
    },
  },
})
