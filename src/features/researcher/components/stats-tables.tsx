import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { effectSizeLabel, formatP } from '@/lib/analytics/stats'

import type { CorrelationRow, SkillAnalysis, SurveyAnalysis } from '../analytics'

const EFFECT_UZ: Record<ReturnType<typeof effectSizeLabel>, string> = {
  negligible: 'ahamiyatsiz',
  small: 'kichik',
  medium: 'o‘rta',
  large: 'katta',
}

function num(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

function SignificanceBadge({ significant }: { significant: boolean }) {
  return (
    <Badge variant={significant ? 'success' : 'outline'}>
      {significant ? 'p < .05' : 'ahamiyatsiz'}
    </Badge>
  )
}

/** Guruh ichidagi pre → post o'sish (bog'liq namunalar t-testi). */
export function PairedTestTable({ skills }: { skills: SkillAnalysis[] }) {
  if (!skills.length) {
    return (
      <EmptyState
        title="Statistika uchun ma’lumot yetarli emas"
        description="Pre-test va post-test natijalari kelgach, bu jadval avtomatik to‘ladi."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ko‘nikma</TableHead>
            <TableHead>Guruh</TableHead>
            <TableHead className="text-right">n</TableHead>
            <TableHead className="text-right">M(pre)</TableHead>
            <TableHead className="text-right">SD</TableHead>
            <TableHead className="text-right">M(post)</TableHead>
            <TableHead className="text-right">SD</TableHead>
            <TableHead className="text-right">O‘sish</TableHead>
            <TableHead className="text-right">t</TableHead>
            <TableHead className="text-right">df</TableHead>
            <TableHead className="text-right">p</TableHead>
            <TableHead className="text-right">d(z)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.flatMap((row) =>
            (['experimental', 'control'] as const).map((side) => {
              const data = row[side]
              return (
                <TableRow key={`${row.skill}-${side}`}>
                  <TableCell className="font-medium">
                    {side === 'experimental' ? row.label : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant={side === 'experimental' ? 'default' : 'secondary'}>
                      {side === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{data.paired.n1}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.pre.mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.pre.sd)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.post.mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.post.sd)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {num(data.paired.meanDiff)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.paired.t)}</TableCell>
                  <TableCell className="text-right tabular-nums">{data.paired.df}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatP(data.paired.p)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.paired.d)}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/** Guruhlararo o'sish farqi: Welch t-testi + Mann–Whitney U + Cohen's d. */
export function BetweenGroupsTable({ skills }: { skills: SkillAnalysis[] }) {
  if (!skills.length) {
    return (
      <EmptyState
        title="Guruhlararo taqqoslash uchun ma’lumot yo‘q"
        description="Ikkala guruhda ham pre va post natijalari bo‘lishi kerak."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ko‘nikma</TableHead>
            <TableHead className="text-right">n(eksp.)</TableHead>
            <TableHead className="text-right">M o‘sish (eksp.)</TableHead>
            <TableHead className="text-right">n(nazorat)</TableHead>
            <TableHead className="text-right">M o‘sish (nazorat)</TableHead>
            <TableHead className="text-right">t (Welch)</TableHead>
            <TableHead className="text-right">df</TableHead>
            <TableHead className="text-right">p</TableHead>
            <TableHead className="text-right">Cohen’s d</TableHead>
            <TableHead className="text-right">U (M–W)</TableHead>
            <TableHead className="text-right">p (M–W)</TableHead>
            <TableHead>Xulosa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((row) => (
            <TableRow key={row.skill} className={row.skill === 'total' ? 'font-medium' : undefined}>
              <TableCell>{row.label}</TableCell>
              <TableCell className="text-right tabular-nums">{row.welch.n2}</TableCell>
              <TableCell className="text-right tabular-nums">
                {num(row.experimental.gain.mean)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.welch.n1}</TableCell>
              <TableCell className="text-right tabular-nums">{num(row.control.gain.mean)}</TableCell>
              <TableCell className="text-right tabular-nums">{num(row.welch.t)}</TableCell>
              <TableCell className="text-right tabular-nums">{num(row.welch.df, 1)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatP(row.welch.p)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {num(row.d)}{' '}
                <span className="text-xs text-muted-foreground">
                  ({EFFECT_UZ[effectSizeLabel(row.d)]})
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.mwu.u}</TableCell>
              <TableCell className="text-right tabular-nums">{formatP(row.mwu.p)}</TableCell>
              <TableCell>
                <SignificanceBadge significant={row.welch.significant} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Korrelyatsiya paneli: AI muloqoti / vaqt ↔ o'sish. */
export function CorrelationTable({ rows }: { rows: CorrelationRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Korrelyatsiya tahlili</CardTitle>
        <CardDescription>
          Pearson r va ahamiyatlilik. Faqat pre va post ikkalasini ham topshirgan ishtirokchilar
          hisobga olinadi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bog‘liqlik</TableHead>
                <TableHead className="text-right">r (umumiy)</TableHead>
                <TableHead className="text-right">n</TableHead>
                <TableHead className="text-right">p</TableHead>
                <TableHead className="text-right">r (eksp.)</TableHead>
                <TableHead className="text-right">r (nazorat)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(row.overall.r, 3)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.overall.n}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatP(row.overall.p)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {num(row.experimental.r, 3)}{' '}
                    <span className="text-xs text-muted-foreground">
                      (n={row.experimental.n})
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {num(row.control.r, 3)}{' '}
                    <span className="text-xs text-muted-foreground">(n={row.control.n})</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Korrelyatsiya sababiy bog‘liqlikni isbotlamaydi. Nazorat guruhida AI xabarlari nolga teng
          bo‘lgani uchun u yerdagi r qiymati hisoblanmasligi mumkin.
        </p>
      </CardContent>
    </Card>
  )
}

/** So'rovnomalar: motivatsiya va AI savodxonligi pre/post. */
export function SurveyTable({ rows }: { rows: SurveyAnalysis[] }) {
  if (!rows.length) {
    return (
      <EmptyState
        title="So‘rovnoma natijalari yo‘q"
        description="Motivatsiya va AI savodxonligi so‘rovnomalari to‘ldirilgach shu yerda ko‘rinadi."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>So‘rovnoma</TableHead>
            <TableHead>Guruh</TableHead>
            <TableHead className="text-right">n</TableHead>
            <TableHead className="text-right">M(pre)</TableHead>
            <TableHead className="text-right">M(post)</TableHead>
            <TableHead className="text-right">t</TableHead>
            <TableHead className="text-right">p</TableHead>
            <TableHead className="text-right">Guruhlararo p</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.flatMap((row) =>
            (['experimental', 'control'] as const).map((side) => {
              const data = row[side]
              return (
                <TableRow key={`${row.key}-${side}`}>
                  <TableCell className="font-medium">
                    {side === 'experimental' ? row.label : ''}
                  </TableCell>
                  <TableCell>
                    <Badge variant={side === 'experimental' ? 'default' : 'secondary'}>
                      {side === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{data.paired.n1}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.pre.mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.post.mean)}</TableCell>
                  <TableCell className="text-right tabular-nums">{num(data.paired.t)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatP(data.paired.p)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {side === 'experimental' ? formatP(row.welch.p) : ''}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
