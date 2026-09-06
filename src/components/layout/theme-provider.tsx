'use client'

import * as React from 'react'

export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'le_theme'

interface ThemeContextValue {
  theme: Theme
  /** Haqiqatda qo`llanilgan rejim (system hal qilingandan keyin) */
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme): 'light' | 'dark' {
  const resolved = theme === 'system' ? systemTheme() : theme
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  return resolved
}

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light')

  // Birinchi renderdan keyin saqlangan qiymatni o`qiymiz (hydration mos bo`lishi uchun)
  React.useEffect(() => {
    let stored: Theme | null = null
    try {
      stored = window.localStorage.getItem(storageKey) as Theme | null
    } catch {
      stored = null
    }
    const initial: Theme =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : defaultTheme
    setThemeState(initial)
    setResolvedTheme(applyTheme(initial))
  }, [defaultTheme, storageKey])

  // Tizim rejimi o`zgarsa kuzatib boramiz
  React.useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolvedTheme(applyTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next)
      setResolvedTheme(applyTheme(next))
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        /* localStorage mavjud bo`lmasligi mumkin (private rejim) */
      }
    },
    [storageKey]
  )

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme() faqat <ThemeProvider> ichida ishlatiladi')
  }
  return ctx
}

/**
 * FOUC oldini olish uchun <head> ichiga qo`yiladigan kichik skript.
 * Faqat statik matn ishlatiladi — foydalanuvchi kiritgan ma`lumot yo`q.
 */
export function ThemeScript({ storageKey = THEME_STORAGE_KEY }: { storageKey?: string }) {
  const script = `(function(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(t==='dark'||t==='light')?t:(d?'dark':'light');var e=document.documentElement;if(r==='dark'){e.classList.add('dark')}else{e.classList.remove('dark')}e.style.colorScheme=r}catch(_){}})()`

  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />
}
