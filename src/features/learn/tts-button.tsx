'use client'

import * as React from 'react'
import { Loader2, Volume2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

/**
 * «Tinglash» tugmasi — matnni `/api/speech/tts` orqali eshittiradi (PLAN 8.1, 8.3).
 * Agar so'zning tayyor `audioUrl` i bo'lsa, TTS umuman chaqirilmaydi.
 * Xizmat ishlamasa — tugma jimgina xabar ko'rsatadi, sahifa buzilmaydi.
 */
export interface TtsButtonProps {
  text: string
  /** Tayyor audio (Storage keshidan) */
  audioUrl?: string
  label?: string
  size?: 'sm' | 'icon' | 'default'
  variant?: 'ghost' | 'outline' | 'secondary'
  className?: string
}

export function TtsButton({
  text,
  audioUrl,
  label = 'Tinglash',
  size = 'sm',
  variant = 'outline',
  className,
}: TtsButtonProps) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const cache = React.useRef<string | null>(audioUrl ?? null)

  React.useEffect(() => {
    cache.current = audioUrl ?? null
  }, [audioUrl])

  React.useEffect(
    () => () => {
      audioRef.current?.pause()
      audioRef.current = null
    },
    []
  )

  async function play(url: string) {
    audioRef.current?.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    try {
      await audio.play()
    } catch {
      setError(true)
    }
  }

  async function handleClick() {
    setError(false)
    if (cache.current) {
      await play(cache.current)
      return
    }

    setPending(true)
    try {
      const response = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        setError(true)
        return
      }

      const type = response.headers.get('content-type') ?? ''
      if (type.startsWith('audio/')) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        cache.current = url
        await play(url)
        return
      }

      const payload = (await response.json()) as
        | { url?: string; data?: { url?: string } }
        | undefined
      const url = payload?.url ?? payload?.data?.url
      if (!url) {
        setError(true)
        return
      }
      cache.current = url
      await play(url)
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => void handleClick()}
        disabled={pending}
        aria-label={`${label}: ${text}`}
        title={`${label}: ${text}`}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Volume2 />}
        {size === 'icon' ? null : label}
      </Button>
      {error ? (
        <span className="text-xs text-muted-foreground">Audio hozir mavjud emas</span>
      ) : null}
    </span>
  )
}
