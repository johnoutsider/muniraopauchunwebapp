'use client'

import * as React from 'react'
import { Check, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setLocale } from '@/lib/i18n/actions'
import { cn } from '@/lib/utils/cn'

type LocaleCode = 'uz' | 'en' | 'ru'

const LOCALE_OPTIONS: Array<{ code: LocaleCode; label: string; short: string }> = [
  { code: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ru', label: 'Русский', short: 'RU' },
]

export interface LocaleSwitcherProps {
  /** Joriy til — berilmasa faqat globus ikonkasi ko‘rsatiladi */
  locale?: LocaleCode
  className?: string
}

export function LocaleSwitcher({ locale, className }: LocaleSwitcherProps) {
  const [pending, startTransition] = React.useTransition()

  const onSelect = (code: LocaleCode) => {
    startTransition(() => {
      void setLocale(code)
    })
  }

  const current = LOCALE_OPTIONS.find((o) => o.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          className={cn('gap-1.5 px-2 text-muted-foreground', className)}
          aria-label="Interfeys tilini tanlash"
        >
          <Globe className="size-4" />
          <span className="hidden text-xs font-semibold sm:inline">{current?.short ?? 'UZ'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Interfeys tili</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.code} onSelect={() => onSelect(option.code)}>
            <span className="flex-1">{option.label}</span>
            {locale === option.code ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
