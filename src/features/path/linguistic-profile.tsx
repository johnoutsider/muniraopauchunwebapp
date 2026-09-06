import * as React from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { ProficiencyBadge } from '@/components/shared/proficiency-badge'
import { SkillIcon } from '@/components/shared/skill-icon'
import { ChartCard } from '@/components/charts/chart-card'
import { SkillRadarChart } from '@/components/charts/skill-radar-chart'
import { SKILL_LABELS } from '@/config/constants'

import { labelFor, profileToRadar, type ProfileRow } from './queries'

export interface LinguisticProfileProps {
  profile: ProfileRow[]
}

/**
 * Individual Linguistic Profile (PLAN 5, 2-bosqich):
 * radar + har ko'nikma bo'yicha ball, yorliq va boshlang'ich qiyinlik darajasi.
 */
export function LinguisticProfileSection({ profile }: LinguisticProfileProps) {
  const radar = profileToRadar(profile, SKILL_LABELS)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ChartCard
        title="Lingvistik profil"
        description="Diagnostika natijasi asosida — har ko‘nikma 0–100 ball"
      >
        {radar.length >= 3 ? (
          <SkillRadarChart data={radar} />
        ) : (
          <EmptyState
            title="Profil hali to‘liq emas"
            description="Radar grafigi uchun kamida 3 ta ko‘nikma bo‘yicha natija kerak."
            action={
              <Button asChild size="sm">
                <Link href="/student/assessment/diagnostic">Diagnostikadan o‘tish</Link>
              </Button>
            }
          />
        )}
      </ChartCard>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ko‘nikmalar bo‘yicha daraja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.length === 0 ? (
            <EmptyState
              title="Ko‘nikma ballari yo‘q"
              description="Diagnostika testidan o‘tganingizdan keyin bu yerda har bir ko‘nikma bo‘yicha kuchli va zaif tomonlaringiz ko‘rinadi."
              action={
                <Button asChild size="sm">
                  <Link href="/student/assessment/diagnostic">Diagnostikani boshlash</Link>
                </Button>
              }
            />
          ) : (
            profile.map((row) => (
              <div key={row.skill} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <SkillIcon skill={row.skill} className="size-4 text-muted-foreground" />
                    {SKILL_LABELS[row.skill].uz}
                    <span className="text-xs text-muted-foreground">({row.entry.cefr})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <ProficiencyBadge label={labelFor(row.entry)} />
                    <span className="w-10 text-right font-medium tabular-nums">
                      {Math.round(row.entry.score)}%
                    </span>
                  </span>
                </div>
                <Progress value={row.entry.score} />
                <p className="text-xs text-muted-foreground">
                  Boshlang‘ich mashq qiyinligi: {row.entry.startDifficulty}/5
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
