import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { FlatCompat } from '@eslint/eslintrc'
import nextPlugin from '@next/eslint-plugin-next'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

/**
 * ESLint 9 flat config.
 *
 * DIQQAT: bu faylning o'zini `ignores` ga qo'shmang. `next build` plaginni
 * aniqlash uchun aynan shu fayl bo'yicha `calculateConfigForFile` chaqiradi;
 * fayl e'tiborsiz qoldirilsa, "plugin was not detected" ogohlantirishi chiqadi.
 *
 * `next build` konfiguratsiyada `@next/next` plaginini nomi bo'yicha qidiradi.
 * FlatCompat orqali kelgan qoidalar ishlaydi, lekin plagin nomi ko'rinmaydi va
 * build "The Next.js plugin was not detected" deb ogohlantiradi. Shuning uchun
 * plaginni ochiq ro'yxatga olamiz.
 */
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'functions/**',
      'scripts/out/**',
      'public/**',
      // Next.js avtomatik generatsiya qiladi; uchlik-slash havolasi ataylab.
      'next-env.d.ts',
    ],
  },
]

export default config
