'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BookOpen, Check, Languages, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { DOMAIN_LABELS } from '@/config/constants'
import { relativeTime } from '@/lib/utils/format'
import type { LessonDoc, LexiconDoc } from '@/types'

import { decideLessonAction, decideLexiconAction } from '../actions'

/** Tasdiqlash / rad etish tugmalari — ikkala ro‘yxat uchun umumiy. */
function DecisionBar({
  onDecide,
  approveLabel = 'Tasdiqlash',
}: {
  onDecide: (decision: 'approved' | 'rejected', reason?: string) => Promise<void>
  approveLabel?: string
}) {
  const [pending, setPending] = React.useState(false)
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState('')

  async function run(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !reason.trim()) {
      toast.error('Rad etish sababini yozing.')
      return
    }
    setPending(true)
    try {
      await onDecide(decision, reason.trim() || undefined)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="success"
        size="sm"
        loading={pending}
        onClick={() => void run('approved')}
      >
        <Check />
        {approveLabel}
      </Button>
      {rejecting ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Rad etish sababi…"
            className="sm:flex-1"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            loading={pending}
            onClick={() => void run('rejected')}
          >
            Rad etish
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setRejecting(false)}
          >
            Bekor
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => setRejecting(true)}
        >
          <X />
          Rad etish
        </Button>
      )}
    </div>
  )
}

export function LessonApprovalList({ lessons }: { lessons: Array<LessonDoc & { id: string }> }) {
  const router = useRouter()

  if (!lessons.length) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="Qoralama dars yo‘q"
        description="Nashr qilinmagan darslar shu yerda tasdiqlashni kutadi."
      />
    )
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <Card key={lesson.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{lesson.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{lesson.type}</Badge>
              <Badge variant="outline">{lesson.cefr}</Badge>
              <Badge variant="outline">{lesson.estimatedMin} daq</Badge>
              <Badge variant="outline">{(lesson.blocks ?? []).length} blok</Badge>
              <span className="text-xs text-muted-foreground">
                {relativeTime(lesson.createdAt)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lesson.summary ? <p className="text-sm">{lesson.summary}</p> : null}
            <ul className="flex flex-wrap gap-1.5">
              {(lesson.blocks ?? []).map((block, index) => (
                <li key={index}>
                  <Badge variant="outline">{block.kind}</Badge>
                </li>
              ))}
            </ul>
            <DecisionBar
              approveLabel="Tasdiqlash va nashr qilish"
              onDecide={async (decision, reason) => {
                const result = await decideLessonAction({
                  lessonId: lesson.id,
                  decision,
                  reason,
                })
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success(decision === 'approved' ? 'Dars nashr qilindi' : 'Dars rad etildi')
                router.refresh()
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LexiconApprovalList({ words }: { words: Array<LexiconDoc & { id: string }> }) {
  const router = useRouter()

  if (!words.length) {
    return (
      <EmptyState
        icon={<Languages />}
        title="Qoralama lug‘at yozuvi yo‘q"
        description="AI yaratgan yangi so‘z kartalari shu yerda tasdiqlanadi."
      />
    )
  }

  return (
    <div className="space-y-3">
      {words.map((word) => (
        <Card key={word.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {word.word}
              {word.ipa ? (
                <span className="font-mono text-sm font-normal text-muted-foreground">
                  /{word.ipa}/
                </span>
              ) : null}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">{word.pos}</Badge>
              <Badge variant="outline">{word.cefr}</Badge>
              {(word.domains ?? []).map((domain) => (
                <Badge key={domain} variant="outline">
                  {DOMAIN_LABELS[domain]?.uz ?? domain}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {word.definitions?.length ? (
              <ol className="list-decimal space-y-0.5 pl-5 text-sm">
                {word.definitions.map((definition, index) => (
                  <li key={index}>
                    {definition.text}
                    {definition.textUz ? (
                      <span className="text-muted-foreground"> — {definition.textUz}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}

            {word.collocations?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {word.collocations.map((collocation, index) => (
                  <Badge key={index} variant={collocation.verified ? 'success' : 'outline'}>
                    {collocation.text}
                    {typeof collocation.corpusCount === 'number'
                      ? ` (${collocation.corpusCount})`
                      : ''}
                  </Badge>
                ))}
              </div>
            ) : null}

            {word.professionalContext ? (
              <p className="rounded-lg bg-muted/40 p-2.5 text-sm">{word.professionalContext}</p>
            ) : null}

            <DecisionBar
              onDecide={async (decision, reason) => {
                const result = await decideLexiconAction({
                  wordId: word.id,
                  decision,
                  reason,
                })
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success(
                  decision === 'approved' ? 'So‘z lug‘atga qo‘shildi' : 'So‘z rad etildi'
                )
                router.refresh()
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
