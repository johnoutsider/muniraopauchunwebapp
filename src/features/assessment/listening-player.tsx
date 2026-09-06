'use client'

import * as React from 'react'
import { AlertTriangle, Headphones, Play } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

/**
 * Listening bo'limi uchun audio (PLAN 8.4).
 *
 * Ikki manba:
 *   1) `audioUrl` — oldindan yozilgan/yuklangan fayl (`ItemDoc.audioUrl`);
 *   2) `text` — `POST /api/speech/tts` orqali sintez qilingan nutq
 *      (server tomonda keshlanadi, PLAN 7.4 xarajat nazorati).
 *
 * Javob turi oldindan noma'lum bo'lishi mumkin (audio oqim yoki `{ url }`),
 * shuning uchun ikkala ko'rinish ham qo'llab-quvvatlanadi.
 */

export interface ListeningPlayerProps {
  audioUrl?: string
  text?: string
  label?: string
  /** Nechta marta tinglashga ruxsat (0 = cheklovsiz) */
  maxPlays?: number
  className?: string
}

async function fetchTtsUrl(text: string): Promise<string> {
  const response = await fetch('/api/speech/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('tts_failed')

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.startsWith('audio/')) {
    return URL.createObjectURL(await response.blob())
  }

  const payload = (await response.json()) as Record<string, unknown> & {
    data?: Record<string, unknown>
  }
  const source = (payload.data ?? payload) as Record<string, unknown>
  const url = source.url ?? source.audioUrl ?? source.src
  if (typeof url !== 'string' || !url) throw new Error('tts_failed')
  return url
}

export function ListeningPlayer({
  audioUrl,
  text,
  label = 'Audioni tinglang',
  maxPlays = 0,
  className,
}: ListeningPlayerProps) {
  const [src, setSrc] = React.useState<string | null>(audioUrl ?? null)
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [plays, setPlays] = React.useState(0)
  const objectUrlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    setSrc(audioUrl ?? null)
    setFailed(false)
    setPlays(0)
  }, [audioUrl, text])

  React.useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    []
  )

  async function handleGenerate() {
    if (!text) return
    setLoading(true)
    setFailed(false)
    try {
      const url = await fetchTtsUrl(text)
      if (url.startsWith('blob:')) objectUrlRef.current = url
      setSrc(url)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const limitReached = maxPlays > 0 && plays >= maxPlays

  if (!audioUrl && !text) return null

  return (
    <div className={cn('space-y-2 rounded-lg border border-border bg-muted/30 p-3', className)}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Headphones className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {label}
      </p>

      {src ? (
        <audio
          controls
          src={src}
          className="w-full"
          onPlay={() => setPlays((count) => count + 1)}
        >
          <track kind="captions" />
        </audio>
      ) : (
        <Button type="button" variant="outline" size="sm" loading={loading} onClick={() => void handleGenerate()}>
          <Play />
          Audioni yuklash
        </Button>
      )}

      {maxPlays > 0 ? (
        <p className="text-xs text-muted-foreground">
          Tinglandi: {plays} / {maxPlays}
          {limitReached ? ' — limit tugadi' : ''}
        </p>
      ) : null}

      {failed ? (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          Audioni yuklab bo‘lmadi. Quyidagi matnni o‘qing va savollarga javob bering.
        </p>
      ) : null}

      {failed && text ? (
        <p className="rounded-md bg-background p-3 text-sm leading-relaxed">{text}</p>
      ) : null}
    </div>
  )
}
