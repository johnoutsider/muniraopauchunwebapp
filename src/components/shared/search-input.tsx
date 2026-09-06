'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

export interface SearchInputProps {
  value?: string
  defaultValue?: string
  placeholder?: string
  /** Debounce (ms), standart 300 */
  delay?: number
  onChange: (value: string) => void
  className?: string
  autoFocus?: boolean
  'aria-label'?: string
}

export function SearchInput({
  value,
  defaultValue = '',
  placeholder = 'Qidirish…',
  delay = 300,
  onChange,
  className,
  autoFocus,
  'aria-label': ariaLabel = 'Qidirish',
}: SearchInputProps) {
  const [inner, setInner] = React.useState(value ?? defaultValue)
  const onChangeRef = React.useRef(onChange)

  React.useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Tashqi (controlled) qiymat o‘zgarsa ichkarini moslaymiz
  React.useEffect(() => {
    if (value !== undefined) setInner(value)
  }, [value])

  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const timer = setTimeout(() => onChangeRef.current(inner), delay)
    return () => clearTimeout(timer)
  }, [inner, delay])

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={inner}
        onChange={(event) => setInner(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {inner ? (
        <button
          type="button"
          onClick={() => setInner('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Tozalash"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
