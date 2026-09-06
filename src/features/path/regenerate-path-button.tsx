'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { regeneratePathAction } from './actions'

export interface RegeneratePathButtonProps {
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

/** «Yo'nalishni yangilash» — qoidalar asosida qayta generatsiya (PLAN 6.7). */
export function RegeneratePathButton({
  label = 'Yo‘nalishni yangilash',
  variant = 'outline',
}: RegeneratePathButtonProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleClick() {
    setPending(true)
    setMessage(null)
    const result = await regeneratePathAction('manual')
    setPending(false)

    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error })
      return
    }
    setMessage({
      kind: 'ok',
      text: `Yangilandi: ${result.data.steps} ta qadam (v${result.data.version}).`,
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        onClick={() => void handleClick()}
        loading={pending}
        disabled={pending}
      >
        <RefreshCw />
        {label}
      </Button>
      {message ? (
        <p
          role="status"
          className={
            message.kind === 'ok' ? 'text-xs text-muted-foreground' : 'text-xs text-destructive'
          }
        >
          {message.text}
        </p>
      ) : null}
    </div>
  )
}
