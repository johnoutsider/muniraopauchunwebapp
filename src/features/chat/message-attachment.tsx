'use client'

import * as React from 'react'
import { FileText, ImageIcon, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

import { getChatAttachmentUrlAction } from './actions'
import type { ChatAttachment } from './types'

/**
 * Biriktirma. Storage'dagi fayl to'g'ridan-to'g'ri ochilmaydi —
 * server a'zolikni tekshirib, 1 soatlik imzolangan havola qaytaradi.
 */
export function MessageAttachment({
  attachment,
  className,
}: {
  attachment: ChatAttachment
  className?: string
}) {
  const isImage = attachment.type.startsWith('image/')
  const [url, setUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const resolve = React.useCallback(async () => {
    if (url || loading) return url
    setLoading(true)
    const result = await getChatAttachmentUrlAction(attachment.path)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return null
    }
    setUrl(result.data.url)
    return result.data.url
  }, [attachment.path, loading, url])

  React.useEffect(() => {
    if (isImage) void resolve()
    // faqat bir marta — rasm ko'rinishi uchun havola kerak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImage])

  if (error) {
    return <p className={cn('text-xs text-destructive', className)}>{error}</p>
  }

  if (isImage) {
    return (
      <div className={cn('mt-1', className)}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={attachment.name}
            className="max-h-64 w-auto max-w-full rounded-lg border border-border object-contain"
          />
        ) : (
          <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
          </div>
        )}
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{attachment.name}</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={async () => {
        const link = url ?? (await resolve())
        if (link) window.open(link, '_blank', 'noopener,noreferrer')
      }}
      className={cn(
        'mt-1 flex w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-left text-xs transition-colors hover:bg-muted',
        className
      )}
    >
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <FileText className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
      <span className="shrink-0 text-muted-foreground">PDF</span>
    </button>
  )
}
