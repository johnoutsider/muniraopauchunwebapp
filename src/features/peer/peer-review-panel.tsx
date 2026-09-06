'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Eye, EyeOff, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { PROJECT_RUBRIC, RUBRIC_LABELS } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

import { submitPeerReviewAction } from './actions'
import { PEER_COMMENT_MIN, PEER_SCORE_MAX, type PeerState } from './types'

/**
 * Jamoadoshlarni rubrika bo'yicha baholash (0–5) + izoh.
 * Natijalar faqat o'z bahosini topshirgan talabaga ochiladi (server tomonda ham).
 */
export function PeerReviewPanel({ state }: { state: PeerState }) {
  const router = useRouter()
  const [activeUid, setActiveUid] = React.useState<string | null>(null)

  if (state.targets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">O‘zaro baholash</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Baholanadigan jamoadosh yo‘q"
            description="Bu ishda sizdan boshqa ishtirokchi yo‘q."
          />
        </CardContent>
      </Card>
    )
  }

  const doneCount = state.targets.filter((target) => target.reviewed).length

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">O‘zaro baholash</CardTitle>
        <Badge variant={state.revealed ? 'success' : 'secondary'}>
          {doneCount} / {state.targets.length} baholandi
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {state.targets.map((target) => (
            <li key={target.uid} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium">{target.name}</span>
                {target.reviewed ? (
                  <Badge variant="success" className="shrink-0">
                    <Check className="size-3" /> baholandi
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant={activeUid === target.uid ? 'secondary' : 'outline'}
                    onClick={() => setActiveUid(activeUid === target.uid ? null : target.uid)}
                  >
                    <Star className="size-3.5" />
                    Baholash
                  </Button>
                )}
              </div>

              {activeUid === target.uid && !target.reviewed ? (
                <PeerReviewForm
                  artifactType={state.artifactType}
                  artifactId={state.artifactId}
                  targetUid={target.uid}
                  targetName={target.name}
                  onDone={() => {
                    setActiveUid(null)
                    router.refresh()
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            {state.revealed ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            Siz olgan baholar
          </p>
          {!state.revealed ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Natijalar barcha jamoadoshlaringizni baholaganingizdan keyin ochiladi.
            </p>
          ) : state.receivedCount === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Hali hech kim sizni baholamagan.</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                O‘rtacha baho:{' '}
                <span className="font-semibold">
                  {state.receivedOverall ?? '—'} / {PEER_SCORE_MAX}
                </span>{' '}
                <span className="text-xs text-muted-foreground">
                  ({state.receivedCount} ta baho)
                </span>
              </p>
              <ul className="space-y-1 text-sm">
                {Object.entries(state.receivedAverages).map(([criterion, value]) => (
                  <li key={criterion} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {RUBRIC_LABELS[criterion]?.uz ?? criterion}
                    </span>
                    <span className="font-medium tabular-nums">{value}</span>
                  </li>
                ))}
              </ul>
              {state.receivedComments.length ? (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">Izohlar</p>
                  {state.receivedComments.map((comment, index) => (
                    <p key={index} className="rounded-md bg-background p-2 text-sm">
                      {comment}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PeerReviewForm({
  artifactType,
  artifactId,
  targetUid,
  targetName,
  onDone,
}: {
  artifactType: PeerState['artifactType']
  artifactId: string
  targetUid: string
  targetName: string
  onDone: () => void
}) {
  const [scores, setScores] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(PROJECT_RUBRIC.map((criterion) => [criterion, 3]))
  )
  const [comment, setComment] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const result = await submitPeerReviewAction({
      artifactType,
      artifactId,
      targetUid,
      rubricScores: scores,
      comment,
    })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(`${targetName} baholandi.`)
    onDone()
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-border pt-3">
      <ul className="space-y-2">
        {PROJECT_RUBRIC.map((criterion) => (
          <li key={criterion} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {RUBRIC_LABELS[criterion]?.uz ?? criterion}
            </span>
            <div className="flex gap-1" role="group" aria-label={RUBRIC_LABELS[criterion]?.uz}>
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scores[criterion] === value}
                  onClick={() => setScores((prev) => ({ ...prev, [criterion]: value }))}
                  className={cn(
                    'size-7 rounded-md border text-xs font-medium transition-colors',
                    scores[criterion] === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1.5">
        <Label htmlFor={`peer-comment-${targetUid}`}>Izoh</Label>
        <Textarea
          id={`peer-comment-${targetUid}`}
          value={comment}
          rows={3}
          required
          placeholder="Nima yaxshi bajarildi va nimani yaxshilash kerak? (kamida bitta jumla)"
          onChange={(event) => setComment(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="sm"
        loading={loading}
        disabled={comment.trim().length < PEER_COMMENT_MIN}
      >
        Bahoni yuborish
      </Button>
      <p className="text-xs text-muted-foreground">
        Baho bir marta yuboriladi va keyin o‘zgartirilmaydi.
      </p>
    </form>
  )
}
