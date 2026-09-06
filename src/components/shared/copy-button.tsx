'use client'

import * as React from 'react'
import { Check, Copy } from 'lucide-react'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  text: string
  label?: string
  /** Faqat ikonka (standart) yoki matn bilan */
  withLabel?: boolean
}

export function CopyButton({
  text,
  label = 'Nusxa olish',
  withLabel = false,
  className,
  variant = 'ghost',
  size,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* clipboard ruxsati yo‘q — jimgina o‘tkazib yuboramiz */
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (withLabel ? 'sm' : 'icon')}
      className={cn(className)}
      onClick={() => void handleCopy()}
      aria-label={copied ? 'Nusxa olindi' : label}
      title={copied ? 'Nusxa olindi' : label}
      {...props}
    >
      {copied ? (
        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-4" />
      )}
      {withLabel ? <span>{copied ? 'Nusxa olindi' : label}</span> : null}
    </Button>
  )
}
