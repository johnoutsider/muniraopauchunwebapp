'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Dices, RefreshCw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'

import {
  applyRandomisationAction,
  previewRandomisationAction,
  type RandomisationMethod,
  type RandomisationPreview,
} from '../actions'

export interface RandomiserProps {
  cohorts: Array<{ id: string; name: string }>
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
}

/**
 * Randomizatsiya vositasi (PLAN 8.18).
 *
 * ILMIY IZOH: taqsimot deterministik PRNG (mulberry32) bilan bajariladi va
 * URUG' (seed) hisobotda keltiriladi — shu tufayli taqsimot boshqa tadqiqotchi
 * tomonidan aynan qayta tiklanishi mumkin (reproducibility).
 * Stratifikatsiyada talabalar diagnostika bali bo'yicha kvartillarga bo'linadi
 * va HAR kvartil ichida navbatma-navbat taqsimlanadi — bu boshlang'ich
 * darajaning guruhlar bo'yicha muvozanatini ta'minlaydi.
 */
export function Randomiser({ cohorts, groups }: RandomiserProps) {
  const router = useRouter()
  const [cohortId, setCohortId] = React.useState(cohorts[0]?.id ?? '')
  const [method, setMethod] = React.useState<RandomisationMethod>('stratified')
  const [seed, setSeed] = React.useState(() => `seed-${new Date().getFullYear()}`)
  const [experimentalGroupId, setExperimentalGroupId] = React.useState(
    groups.find((group) => group.type === 'experimental')?.id ?? ''
  )
  const [controlGroupId, setControlGroupId] = React.useState(
    groups.find((group) => group.type === 'control')?.id ?? ''
  )
  const [onlyUnassigned, setOnlyUnassigned] = React.useState(true)
  const [preview, setPreview] = React.useState<RandomisationPreview | null>(null)
  const [pending, setPending] = React.useState<'preview' | 'apply' | null>(null)

  const input = {
    cohortId,
    method,
    seed,
    experimentalGroupId,
    controlGroupId,
    onlyUnassigned,
  }

  async function runPreview() {
    setPending('preview')
    try {
      const result = await previewRandomisationAction(input)
      if (result.ok) {
        setPreview(result.data)
        toast.success(`${result.data.total} ta talaba taqsimlandi (oldindan ko‘rish)`)
      } else {
        setPreview(null)
        toast.error(result.error)
      }
    } finally {
      setPending(null)
    }
  }

  async function apply() {
    setPending('apply')
    try {
      const result = await applyRandomisationAction(input)
      if (result.ok) {
        toast.success(
          `Taqsimot qo‘llandi: ${result.data.experimental} eksperimental, ${result.data.control} nazorat`
        )
        setPreview(null)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(null)
    }
  }

  if (!cohorts.length || groups.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Randomizatsiya</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Avval kohort va guruhlar kerak"
            description="Kamida bitta kohort, bitta eksperimental va bitta nazorat guruhi yarating."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="size-4 text-primary" />
          Randomizatsiya vositasi
        </CardTitle>
        <CardDescription>
          Kohort talabalarini eksperimental va nazorat guruhlariga taqsimlaydi. Urug‘ (seed) bir xil
          bo‘lsa — taqsimot ham aynan bir xil bo‘ladi, ya‘ni natija qayta tiklanadi va
          dissertatsiyada keltirilishi mumkin.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Kohort</Label>
            <Select value={cohortId} onValueChange={setCohortId}>
              <SelectTrigger>
                <SelectValue placeholder="Kohortni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Usul</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as RandomisationMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Oddiy tasodifiy</SelectItem>
                <SelectItem value="stratified">
                  Stratifikatsiyalangan (diagnostika bali bo‘yicha)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seed">Urug‘ (seed)</Label>
            <div className="flex gap-2">
              <Input
                id="seed"
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="seed-2027"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Yangi tasodifiy urug‘"
                onClick={() => setSeed(Math.random().toString(36).slice(2, 10))}
              >
                <RefreshCw />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Eksperimental guruh</Label>
            <Select value={experimentalGroupId} onValueChange={setExperimentalGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((group) => group.type === 'experimental')
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Nazorat guruhi</Label>
            <Select value={controlGroupId} onValueChange={setControlGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .filter((group) => group.type === 'control')
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-end gap-2 pb-2 text-sm">
            <Checkbox
              checked={onlyUnassigned}
              onCheckedChange={(value) => setOnlyUnassigned(value === true)}
            />
            Faqat guruhi yo‘q talabalar
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            loading={pending === 'preview'}
            onClick={() => void runPreview()}
          >
            <Dices />
            Oldindan ko‘rish
          </Button>
          <Button
            type="button"
            disabled={!preview || pending !== null}
            loading={pending === 'apply'}
            onClick={() => void apply()}
          >
            <ShieldCheck />
            Taqsimotni qo‘llash
          </Button>
        </div>

        {preview ? (
          <div className="space-y-4">
            {preview.warnings.map((warning) => (
              <Alert key={warning} variant="warning">
                <AlertTriangle />
                <AlertTitle>Diqqat</AlertTitle>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Eksperimental
                </p>
                <p className="text-2xl font-semibold">{preview.balance.experimental.n}</p>
                <p className="text-xs text-muted-foreground">
                  Diagnostika o‘rtachasi: {preview.balance.experimental.mean ?? '—'}
                  {preview.balance.experimental.sd !== null
                    ? ` (SD ${preview.balance.experimental.sd})`
                    : ''}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nazorat</p>
                <p className="text-2xl font-semibold">{preview.balance.control.n}</p>
                <p className="text-xs text-muted-foreground">
                  Diagnostika o‘rtachasi: {preview.balance.control.mean ?? '—'}
                  {preview.balance.control.sd !== null
                    ? ` (SD ${preview.balance.control.sd})`
                    : ''}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strata</TableHead>
                    <TableHead className="text-right">Eksperimental (n)</TableHead>
                    <TableHead className="text-right">Nazorat (n)</TableHead>
                    <TableHead className="text-right">O‘rtacha (eksp.)</TableHead>
                    <TableHead className="text-right">O‘rtacha (nazorat)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.strata.map((stratum) => (
                    <TableRow key={stratum.stratum}>
                      <TableCell className="font-medium">{stratum.stratum}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {stratum.experimental}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{stratum.control}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {stratum.meanExperimental ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {stratum.meanControl ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <details className="rounded-xl border border-border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Taqsimot ro‘yxati ({preview.assignments.length} ta) — qo‘llashdan oldin tekshiring
              </summary>
              <div className="mt-3 max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Strata</TableHead>
                      <TableHead className="text-right">Diagnostika</TableHead>
                      <TableHead>Guruh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.assignments.map((assignment) => (
                      <TableRow key={assignment.uid}>
                        <TableCell className="font-mono text-xs">
                          {assignment.participantCode}
                        </TableCell>
                        <TableCell className="text-xs">{assignment.stratum}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {assignment.diagnosticTotal ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={assignment.target === 'experimental' ? 'default' : 'secondary'}
                          >
                            {assignment.target === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ro‘yxatda faqat ishtirokchi kodi ko‘rsatilgan — ism-familiya bu yerda ochilmaydi.
              </p>
            </details>

            <Alert variant="info">
              <AlertDescription>
                Hisobot uchun: usul — {method === 'stratified' ? 'stratifikatsiyalangan' : 'oddiy'}{' '}
                tasodifiy taqsimot, urug‘ (seed) — <code className="font-mono">{preview.seed}</code>,
                jami {preview.total} ishtirokchi.
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
