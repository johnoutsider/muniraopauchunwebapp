'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bot, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'

/**
 * `ai_explain` bloki — FAQAT `flags.aiTutor` yoqilgan guruh uchun render qilinadi
 * (chaqiruvchi sahifa `FlagGate` bilan o'raydi; bu komponent o'zi hech narsa
 * qaror qilmaydi). Nazorat guruhi bu blokni umuman ko'rmaydi (PLAN 1.5).
 */
export interface AiExplainBlockProps {
  prompt: string
  label: string
  lessonId: string
  lessonTitle: string
}

export function AiExplainBlock({ prompt, label, lessonId, lessonTitle }: AiExplainBlockProps) {
  const [answer, setAnswer] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleAsk() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lessonId, context: lessonTitle, mode: 'lesson_explain' }),
      })
      if (!response.ok) {
        setError('AI o‘qituvchi hozir javob bera olmadi. Chat orqali urinib ko‘ring.')
        return
      }
      const payload: unknown = await response.json()
      const text = readText(payload)
      if (!text) {
        setError('Javob bo‘sh qaytdi. Chat orqali urinib ko‘ring.')
        return
      }
      setAnswer(text)
    } catch {
      setError('Tarmoq xatosi. Keyinroq urinib ko‘ring.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <AiBadge label="AI o‘qituvchi" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="text-sm text-muted-foreground">Savol: {prompt}</p>

        {answer ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <MarkdownText>{answer}</MarkdownText>
          </div>
        ) : null}

        {error ? <p className="text-xs text-muted-foreground">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          {!answer ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void handleAsk()}
              loading={pending}
              disabled={pending}
            >
              <Bot />
              Tushuntirib ber
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={`/student/ai-teacher?prompt=${encodeURIComponent(prompt)}`}>
              Chatda davom ettirish
              <ExternalLink />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function readText(payload: unknown): string | null {
  if (typeof payload === 'string') return payload.trim() || null
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  for (const key of ['text', 'answer', 'explanation', 'content']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  const data = record.data
  if (data && typeof data === 'object') return readText(data)
  if (typeof data === 'string') return data.trim() || null
  return null
}
