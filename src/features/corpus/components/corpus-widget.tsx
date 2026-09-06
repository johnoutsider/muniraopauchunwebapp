'use client'

import * as React from 'react'
import { Database, Loader2, Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'
import { cn } from '@/lib/utils/cn'

import { postAi, type AiRequestError } from '@/features/ai-teacher/ai-request'
import { lookupCorpusStats } from '../actions'
import { VERDICT_META, type CorpusStats, type CorpusVerdictResult } from '../types'

const SUGGESTIONS: Array<{ phrase: string; alternative: string }> = [
  { phrase: 'make a profit', alternative: 'do a profit' },
  { phrase: 'raise interest rates', alternative: 'lift interest rates' },
  { phrase: 'meet the deadline', alternative: 'catch the deadline' },
  { phrase: 'launch a product', alternative: 'start a product' },
]

function StatsBlock({ stats, highlight }: { stats: CorpusStats; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border p-3',
        highlight && 'border-primary/40 bg-primary/5'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm">{stats.phrase}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {stats.found ? `${stats.count} marta · ${stats.docFreq} hujjatda` : 'korpusda topilmadi'}
        </span>
      </div>
      {stats.examples.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
          {stats.examples.map((example, index) => (
            <li key={index}>«{example.sentence}»</li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Corpus Verification vidjeti (PLAN 8.16).
 * Xom chastota Firestore'dan (`corpusNgrams`), verdikt va izoh esa
 * `POST /api/ai/corpus-verify` orqali keladi.
 */
export function CorpusWidget() {
  const [phrase, setPhrase] = React.useState('')
  const [alternative, setAlternative] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<AiRequestError | string | null>(null)
  const [verdict, setVerdict] = React.useState<CorpusVerdictResult | null>(null)
  const [stats, setStats] = React.useState<{
    main: CorpusStats
    alternative: CorpusStats | null
  } | null>(null)

  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  async function handleCheck(nextPhrase = phrase, nextAlternative = alternative) {
    const cleaned = nextPhrase.trim()
    if (cleaned.length < 2) {
      setError('Tekshirish uchun iborani kiriting (kamida 2 belgi).')
      return
    }

    setLoading(true)
    setError(null)
    setVerdict(null)
    setStats(null)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 60_000)

    const [statsResult, verdictResult] = await Promise.all([
      lookupCorpusStats(cleaned, nextAlternative.trim() || undefined),
      postAi<CorpusVerdictResult>(
        '/api/ai/corpus-verify',
        { phrase: cleaned, alternative: nextAlternative.trim() || undefined },
        controller.signal
      ),
    ])

    clearTimeout(timeout)
    abortRef.current = null
    setLoading(false)

    if (statsResult.ok) setStats(statsResult.data)

    if (!verdictResult.ok) {
      setError(verdictResult.error)
      return
    }
    setVerdict(verdictResult.data)
  }

  const meta = verdict ? VERDICT_META[verdict.verdict] : null
  const errorText = typeof error === 'string' ? error : error?.message

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" />
            Corpus Verification
          </CardTitle>
          <CardDescription>
            Ibora ingliz tilida haqiqatan ishlatiladimi? Mini-korpusdagi chastota va misollar bilan
            tekshiring.
          </CardDescription>
        </div>
        <AiBadge label="AI izohi + korpus dalili" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="corpus-phrase">Tekshiriladigan ibora</Label>
            <Input
              id="corpus-phrase"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCheck()
              }}
              placeholder="make a profit"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="corpus-alt">Muqobil variant (ixtiyoriy)</Label>
            <Input
              id="corpus-alt"
              value={alternative}
              onChange={(event) => setAlternative(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCheck()
              }}
              placeholder="do a profit"
              maxLength={120}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void handleCheck()} loading={loading} disabled={loading}>
            <Search />
            Tekshirish
          </Button>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.phrase}
              type="button"
              disabled={loading}
              onClick={() => {
                setPhrase(item.phrase)
                setAlternative(item.alternative)
                void handleCheck(item.phrase, item.alternative)
              }}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {item.phrase} vs {item.alternative}
            </button>
          ))}
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Korpus tekshirilmoqda…
          </p>
        )}

        {errorText && (
          <Alert
            variant={typeof error !== 'string' && error?.quotaExceeded ? 'default' : 'destructive'}
          >
            <AlertTitle>
              {typeof error !== 'string' && error?.quotaExceeded
                ? 'Kunlik AI limiti tugadi'
                : 'Tekshirib bo‘lmadi'}
            </AlertTitle>
            <AlertDescription className="space-y-1">
              <p>{errorText}</p>
              {stats && (
                <p className="text-xs">
                  Korpus raqamlari quyida ko‘rsatilgan — ular AI izohisiz ham dalil bo‘lib xizmat
                  qiladi.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {stats && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Korpus statistikasi
            </p>
            <StatsBlock stats={stats.main} highlight />
            {stats.alternative && <StatsBlock stats={stats.alternative} />}
            {!stats.main.found && (
              <p className="text-[11px] text-muted-foreground">
                Iborani korpus topmadi. Bu «xato» degani emas: mini-korpus hajmi cheklangan (~1–2
                mln so‘z). Quyidagi izohga e’tibor bering.
              </p>
            )}
          </div>
        )}

        {verdict && meta && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={meta.tone} className="text-sm">
                  {meta.sign} {meta.uz}
                </Badge>
                <span className="text-xs text-muted-foreground">{meta.hint}</span>
              </div>

              <MarkdownText>{verdict.explanation}</MarkdownText>

              {verdict.exampleSentences.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Namuna gaplar
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {verdict.exampleSentences.map((sentence, index) => (
                      <li key={index}>{sentence}</li>
                    ))}
                  </ul>
                </div>
              )}

              {verdict.betterAlternatives.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Yaxshiroq variantlar
                  </p>
                  <ul className="space-y-1 text-sm">
                    {verdict.betterAlternatives.map((item, index) => (
                      <li key={index}>
                        <span className="font-mono">{item.phrase}</span>{' '}
                        <span className="text-muted-foreground">— {item.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
