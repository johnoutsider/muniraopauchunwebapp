import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'

import { ThemeProvider, ThemeScript } from '@/components/layout/theme-provider'
import { APP_NAME, APP_TAGLINE } from '@/config/constants'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Professional English for Economics`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'Sun\u2018iy intellekt asosida iqtisodiyot yo\u2018nalishi talabalarining professional ingliz tilidagi lingvistik kompetensiyasini rivojlantirish platformasi.',
  applicationName: APP_NAME,
  keywords: ['English for economics', 'AI tutor', 'ESP', 'DSc research', 'adaptive learning'],
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#12151c' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </ThemeProvider>
        </NextIntlClientProvider>
        <span className="sr-only">{APP_TAGLINE}</span>
      </body>
    </html>
  )
}
