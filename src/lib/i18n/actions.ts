'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { LOCALES, LOCALE_COOKIE, type Locale } from './request'

export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return
  const store = await cookies()
  store.set(LOCALE_COOKIE, locale, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  revalidatePath('/', 'layout')
}
