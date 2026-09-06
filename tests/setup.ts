import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Global test setup.
 * Komponent testlaridan keyin DOM tozalanadi, aks holda keyingi test avvalgi
 * render qoldig'ini ko'radi.
 */
afterEach(() => {
  cleanup()
})

/** Toza, bashorat qilinadigan muhit — testlar real kalitlarga tegmasin. */
process.env.TZ = process.env.TZ ?? 'UTC'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
