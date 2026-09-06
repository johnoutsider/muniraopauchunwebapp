import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, BellRing, Dumbbell, Gauge, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { SkillIcon } from '@/components/shared/skill-icon'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { SKILL_LABELS, DIFFICULTY_CEFR } from '@/config/constants'
import { percent } from '@/lib/utils/format'
import { getPracticeHub } from '@/features/practice/queries'
import type { SkillPracticeCard } from '@/features/practice/types'

export const metadata: Metadata = { title: 'Mashq maydoni' }
export const dynamic = 'force-dynamic'

export default async function PracticePage() {
  const user = await requireStudent()
  const [cards, flags] = await Promise.all([getPracticeHub(user.uid), resolveFlags(user)])

  const totalAttempts = cards.reduce((sum, card) => sum + card.attempts, 0)
  const totalCorrect = cards.reduce((sum, card) => sum + card.correct, 0)
  const avgMastery = cards.length
    ? Math.round(cards.reduce((sum, card) => sum + card.mastery, 0) / cards.length)
    : 0
  const dueCount = cards.reduce((sum, card) => sum + card.dueCount, 0)
  const hasContent = cards.some((card) => card.itemCount > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mashq maydoni"
        description="5-bosqich: mashq va avtomatlashtirish. Mashqlar sizning darajangizga moslashadi — 3 ta ketma-ket to‘g‘ri javob qiyinlikni oshiradi."
        breadcrumbs={[
          { label: 'Bosh sahifa', href: '/student/dashboard' },
          { label: 'Mashq maydoni' },
        ]}
        actions={
          dueCount > 0 ? (
            <Button asChild>
              <Link href="/student/practice/vocabulary?mode=review">
                <BellRing />
                {dueCount} ta so‘zni takrorlash
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="O‘rtacha o‘zlashtirish"
          value={`${avgMastery}%`}
          sublabel="Barcha ko‘nikmalar bo‘yicha"
          icon={<Gauge className="size-4" />}
          tone={avgMastery >= 70 ? 'success' : 'default'}
        />
        <StatCard
          label="Aniqlik"
          value={totalAttempts ? `${percent(totalCorrect, totalAttempts)}%` : '—'}
          sublabel={`${totalAttempts} ta urinish`}
          icon={<Target className="size-4" />}
        />
        <StatCard
          label="Takrorlash navbati"
          value={dueCount}
          sublabel={dueCount ? 'Bugun takrorlash kerak' : 'Navbat bo‘sh'}
          icon={<BellRing className="size-4" />}
          tone={dueCount > 10 ? 'warning' : 'default'}
        />
        <StatCard
          label="Mashqlar bazasi"
          value={cards.reduce((sum, card) => sum + card.itemCount, 0)}
          sublabel="Tasdiqlangan mashqlar"
          icon={<Dumbbell className="size-4" />}
        />
      </div>

      {!flags.adaptive ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Sizning guruhingizda mashqlar barcha talabalar uchun bir xil ketma-ketlikda beriladi.
        </p>
      ) : null}

      {!hasContent ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Dumbbell />}
              title="Mashqlar bazasi hali bo‘sh"
              description="Tasdiqlangan mashqlar qo‘shilgach, bu yerda har bir ko‘nikma bo‘yicha adaptiv sessiyalar ochiladi."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/learn">Darslarga o‘tish</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <SkillCard key={card.skill} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

function SkillCard({ card }: { card: SkillPracticeCard }) {
  const label = SKILL_LABELS[card.skill]
  const href =
    card.skill === 'vocabulary' && card.dueCount > 0
      ? '/student/practice/vocabulary?mode=review'
      : `/student/practice/${card.skill}`

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <SkillIcon skill={card.skill} className="size-4" />
            </span>
            {label.uz}
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline">Daraja {card.difficulty}/5</Badge>
            <span className="text-[11px] text-muted-foreground">
              ≈ {DIFFICULTY_CEFR[card.difficulty] ?? 'B1'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>O‘zlashtirish</span>
            <span className="tabular-nums">{card.mastery}%</span>
          </div>
          <Progress value={card.mastery} aria-label={`${label.uz} o‘zlashtirish darajasi`} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{card.itemCount} ta mashq</span>
          <span>·</span>
          <span>{card.attempts} urinish</span>
          {card.dueCount > 0 ? (
            <>
              <span>·</span>
              <Badge variant="warning">{card.dueCount} ta takrorlash</Badge>
            </>
          ) : null}
        </div>

        {card.topics.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Eng zaif mavzular
            </p>
            <ul className="space-y-1">
              {card.topics.slice(0, 3).map((topic) => (
                <li key={topic.topic} className="flex items-center justify-between text-xs">
                  <span className="truncate">{topic.topic}</span>
                  <span className="tabular-nums text-muted-foreground">{topic.mastery}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Bu ko‘nikma bo‘yicha hali mashq qilinmagan.
          </p>
        )}

        {card.itemCount === 0 && card.dueCount === 0 ? (
          <Button type="button" className="w-full" variant="outline" disabled>
            Mashqlar tayyorlanmoqda
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={href}>
              {card.dueCount > 0 ? 'Takrorlashni boshlash' : 'Mashqni boshlash'}
              <ArrowRight />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
