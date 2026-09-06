'use client'

import * as React from 'react'
import { Bot, CircleStop, Send, ThumbsDown, ThumbsUp, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'
import { cn } from '@/lib/utils/cn'
import { AI_LIMITS } from '@/config/constants'

import type { AiRequestError } from '../ai-request'
import type { ChatMessage, QuotaInfo } from '../types'

/* ------------------------------------------------------------------ */
/* Kunlik limit ko'rsatkichi                                            */
/* ------------------------------------------------------------------ */

export function QuotaMeter({ quota }: { quota: QuotaInfo }) {
  const used = Math.min(quota.used, quota.limit)
  const value = quota.limit > 0 ? (used / quota.limit) * 100 : 0

  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Bugungi AI limiti</span>
        <span
          className={cn(
            'tabular-nums',
            quota.blocked ? 'font-semibold text-destructive' : 'text-muted-foreground'
          )}
        >
          {used} / {quota.limit}
        </span>
      </div>
      <Progress value={value} />
      <p className="text-[11px] leading-snug text-muted-foreground">
        {quota.blocked
          ? (quota.reason ??
            'Bugungi limit tugadi. Ertaga yangilanadi — hozircha darslar va mashqlardan foydalaning.')
          : `Yana ${quota.remaining} ta so‘rov qoldi. Limit har kuni yarim tunda yangilanadi (kuniga ${AI_LIMITS.MESSAGES_PER_DAY} ta so‘rov).`}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Xabar                                                                */
/* ------------------------------------------------------------------ */

export interface MessageBubbleProps {
  message: ChatMessage
  /** Persona nomi (role-play rejimida "AI o'qituvchi" o'rniga ko'rsatiladi). */
  assistantLabel?: string
  assistantEmoji?: string
  onRate?: (helpful: boolean) => void
  rating?: boolean | null
  ratingPending?: boolean
}

export function MessageBubble({
  message,
  assistantLabel = 'AI o‘qituvchi',
  assistantEmoji,
  onRate,
  rating,
  ratingPending,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full text-sm',
          isUser ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="size-4" />
        ) : assistantEmoji ? (
          <span>{assistantEmoji}</span>
        ) : (
          <Bot className="size-4" />
        )}
      </div>

      <div className={cn('min-w-0 max-w-[85%] space-y-1.5', isUser && 'items-end text-right')}>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{isUser ? 'Siz' : assistantLabel}</span>
          {!isUser && message.isFeedback && <AiBadge label="AI feedback" />}
        </div>

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-left',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-border bg-card'
          )}
        >
          {message.content ? (
            <MarkdownText className={cn(isUser && 'text-primary-foreground')}>
              {message.content}
            </MarkdownText>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-current" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
            </span>
          )}
        </div>

        {!isUser && !message.streaming && message.content && onRate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Foydali bo‘ldimi?</span>
            <button
              type="button"
              disabled={ratingPending}
              onClick={() => onRate(true)}
              aria-label="Foydali bo‘ldi"
              aria-pressed={rating === true}
              className={cn(
                'rounded p-1 transition-colors hover:bg-muted disabled:opacity-50',
                rating === true && 'text-emerald-600'
              )}
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={ratingPending}
              onClick={() => onRate(false)}
              aria-label="Foydali bo‘lmadi"
              aria-pressed={rating === false}
              className={cn(
                'rounded p-1 transition-colors hover:bg-muted disabled:opacity-50',
                rating === false && 'text-destructive'
              )}
            >
              <ThumbsDown className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Xato paneli                                                          */
/* ------------------------------------------------------------------ */

export function ChatError({ error, onRetry }: { error: AiRequestError; onRetry?: () => void }) {
  if (error.aborted) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Javob to‘xtatildi. Yozilgan qismi saqlanib qoldi.
      </p>
    )
  }

  const title = error.quotaExceeded
    ? 'Kunlik limit tugadi'
    : error.unauthenticated
      ? 'Sessiya tugagan'
      : error.flagDisabled
        ? 'Imkoniyat yoqilmagan'
        : 'Xatolik'

  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        {error.unauthenticated ? (
          <Button size="sm" variant="outline" asChild>
            <a href="/login">Qaytadan kirish</a>
          </Button>
        ) : onRetry && !error.quotaExceeded && !error.flagDisabled ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Qaytadan urinish
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

/* ------------------------------------------------------------------ */
/* Kompozitor                                                           */
/* ------------------------------------------------------------------ */

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  streaming: boolean
  disabled?: boolean
  placeholder?: string
  /** Mikrofon tugmasi (role-play ovozli rejimi) */
  extra?: React.ReactNode
  hint?: React.ReactNode
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  disabled,
  placeholder = 'Savolingizni yozing… (Enter — yuborish, Shift+Enter — yangi qator)',
  extra,
  hint,
}: ChatComposerProps) {
  const tooLong = value.length > AI_LIMITS.MAX_INPUT_CHARS

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!disabled && !streaming && !tooLong) onSubmit()
    }
  }

  return (
    <div className="space-y-2 border-t border-border bg-card/60 p-3">
      <div className="flex items-end gap-2">
        {extra}
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={disabled}
          className="max-h-40 min-h-[42px] flex-1 resize-y"
          aria-label="Xabar matni"
        />
        {streaming ? (
          <Button type="button" variant="outline" onClick={onStop} aria-label="To‘xtatish">
            <CircleStop />
            To‘xtatish
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim() || tooLong}
            aria-label="Yuborish"
          >
            <Send />
            Yuborish
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{hint}</span>
        {tooLong && (
          <span className="text-destructive">
            Xabar juda uzun ({value.length} / {AI_LIMITS.MAX_INPUT_CHARS} belgi)
          </span>
        )}
      </div>
    </div>
  )
}
