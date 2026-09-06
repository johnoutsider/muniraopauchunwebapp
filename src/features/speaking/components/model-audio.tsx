'use client'

import * as React from 'react'
import { Loader2, Volume2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

import { postAi } from '@/features/ai-teacher/ai-request'

export interface ModelAudioProps {
  /** Namuna sifatida sintez qilinadigan matn (referenceText). */
  text: string
  label?: string
  className?: string
  size?: 'default' | 'sm'
}

/**
 * «Namunani eshitish» — Azure TTS (`POST /api/speech/tts`).
 * Natija Storage'da keshlanadi, shuning uchun bir matn bir marta sintez qilinadi.
 */
export function ModelAudio({
  text,
  label = 'Namunani eshitish',
  className,
  size = 'sm',
}: ModelAudioProps) {
  const [loading, setLoading] = React.useState(false)
  const [url, setUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const trimmed = text.trim()

  // Manzil kelgach avtomatik ijro
  React.useEffect(() => {
    if (url) void audioRef.current?.play().catch(() => undefined)
  }, [url])

  async function handlePlay() {
    setError(null)
    if (url) {
      void audioRef.current?.play()
      return
    }

    setLoading(true)
    const result = await postAi<{ url: string; cached: boolean }>('/api/speech/tts', {
      text: trimmed.slice(0, 600),
    })
    setLoading(false)

    if (!result.ok) {
      setError(result.error.message)
      return
    }
    setUrl(result.data.url)
  }

  if (!trimmed) return null

  return (
    <div className={cn('space-y-1', className)}>
      <Button type="button" variant="outline" size={size} onClick={handlePlay} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <Volume2 />}
        {label}
      </Button>
      {url && <audio ref={audioRef} src={url} controls className="mt-1 h-8 w-full max-w-xs" />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
