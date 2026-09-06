'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { setLeaderboardOptInAction } from './actions'

export interface LeaderboardOptInProps {
  optIn: boolean
  description?: string
}

/** Reytingda ko'rinish — ixtiyoriy va istalgan vaqtda o'chiriladi. */
export function LeaderboardOptIn({ optIn, description }: LeaderboardOptInProps) {
  const router = useRouter()
  const [checked, setChecked] = React.useState(optIn)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleChange(next: boolean) {
    setChecked(next)
    setPending(true)
    setError(null)
    const result = await setLeaderboardOptInAction(next)
    setPending(false)
    if (!result.ok) {
      setChecked(!next)
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Switch
          id="leaderboard-opt-in"
          checked={checked}
          disabled={pending}
          onCheckedChange={(value) => void handleChange(value)}
        />
        <Label htmlFor="leaderboard-opt-in" className="text-sm">
          Guruh reytingida ishtirok etaman
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {description ??
          'Reytingda faqat ishtirokchi kodingiz yoki ismingiz ko‘rinadi — email va boshqa shaxsiy ma’lumot hech qachon ko‘rsatilmaydi.'}
      </p>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
