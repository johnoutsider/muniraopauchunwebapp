import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, BookA, Braces, Layers, Network, Repeat2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { FlagGate } from '@/components/shared/flag-gate'
import { StatCard } from '@/components/shared/stat-card'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { SKILLS, SKILL_LABELS, DIFFICULTY_CEFR, type Skill } from '@/config/constants'
import { getGrammarTopics, getPracticeSession } from '@/features/practice/queries'
import { ExerciseRunner } from '@/features/practice/exercise-runner'
import { getReviewQueue, getVocabOverview, getMyWords } from '@/features/vocabulary/queries'
import { ReviewFlow } from '@/features/vocabulary/review-flow'
import { WordCard } from '@/features/vocabulary/word-card'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ skill: string }>
  searchParams: Promise<{ mode?: string; topic?: string; count?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { skill } = await params
  const label = SKILL_LABELS[skill as Skill]?.uz
  return { title: label ? `${label} mashqlari` : 'Mashq' }
}

export default async function PracticeSkillPage({ params, searchParams }: PageProps) {
  const { skill } = await params
  const query = await searchParams

  if (!SKILLS.includes(skill as Skill)) notFound()
  const typedSkill = skill as Skill

  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const label = SKILL_LABELS[typedSkill]

  const breadcrumbs = [
    { label: 'Mashq maydoni', href: '/student/practice' },
    { label: label.uz },
  ]

  /* ---------------------------------------------------------------- */
  /* Lug'at — SRS takrorlash rejimi                                     */
  /* ---------------------------------------------------------------- */
  if (typedSkill === 'vocabulary' && query.mode === 'review') {
    const cards = await getReviewQueue(user.uid, 15)
    return (
      <div className="space-y-6">
        <PageHeader
          title="So‘zlarni takrorlash"
          description="Spaced repetition (SM-2): har so‘z unutilish chegarasida takrorlanadi. Karta 6 bosqichda ochiladi."
          breadcrumbs={[...breadcrumbs, { label: 'Takrorlash' }]}
          actions={
            <Button asChild variant="outline">
              <Link href="/student/practice/vocabulary">
                <BookA />
                Mening so‘zlarim
              </Link>
            </Button>
          }
        />
        <ReviewFlow cards={cards} semanticNetwork={flags.semanticNetwork} />
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Lug'at — asosiy sahifa                                             */
  /* ---------------------------------------------------------------- */
  if (typedSkill === 'vocabulary' && !query.topic) {
    const [overview, words, session] = await Promise.all([
      getVocabOverview(user.uid),
      getMyWords(user.uid, 12),
      getPracticeSession(user.uid, {
        skill: 'vocabulary',
        count: 10,
        adaptive: flags.adaptive,
      }),
    ])

    return (
      <div className="space-y-6">
        <PageHeader
          title="Lug‘at mashqlari"
          description="Kasbiy leksika: kollokatsiya, terminologiya va so‘z yasalishi. Takrorlash SM-2 algoritmi bo‘yicha rejalashtiriladi."
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex flex-wrap gap-2">
              {overview.dueCount > 0 ? (
                <Button asChild>
                  <Link href="/student/practice/vocabulary?mode=review">
                    <Repeat2 />
                    {overview.dueCount} ta so‘zni takrorlash
                  </Link>
                </Button>
              ) : null}
              <FlagGate enabled={flags.semanticNetwork}>
                <Button asChild variant="outline">
                  <Link href="/student/practice/vocabulary/network">
                    <Network />
                    Semantik tarmoq
                  </Link>
                </Button>
              </FlagGate>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Mening so‘zlarim" value={overview.total} sublabel="Jami qo‘shilgan" />
          <StatCard label="O‘rganilmoqda" value={overview.learning} sublabel="Takrorlash davom etadi" />
          <StatCard
            label="O‘zlashtirilgan"
            value={overview.known}
            sublabel="Uzoq intervalga o‘tgan"
            tone="success"
          />
          <StatCard
            label="Bugun takrorlash"
            value={overview.dueCount}
            sublabel={
              overview.nextDueInDays !== null
                ? `Keyingisi ${overview.nextDueInDays} kundan keyin`
                : 'Navbat bo‘sh'
            }
            tone={overview.dueCount > 0 ? 'warning' : 'default'}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lug‘at mashqi</CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseRunner
              items={session.items}
              skill="vocabulary"
              difficulty={session.difficulty}
              aiExplain={flags.aiFeedback}
              adaptive={flags.adaptive}
              continueHref="/student/practice/vocabulary"
              continueLabel="Lug‘atga qaytish"
            />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Mening so‘zlarim</h2>
          {words.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={<BookA />}
                  title="Ro‘yxat bo‘sh"
                  description="Darslardagi lug‘at bloklaridan so‘zlarni qo‘shsangiz, ular shu yerda takrorlash jadvali bilan paydo bo‘ladi."
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href="/student/learn?skill=vocabulary">Lug‘at darslari</Link>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {words.map((card) =>
                card.lexicon ? (
                  <WordCard
                    key={card.id}
                    word={card.lexicon}
                    semanticNetwork={flags.semanticNetwork}
                  />
                ) : (
                  <Card key={card.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{card.word}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Lug‘at kartasi topilmadi. Takrorlash: {card.reps} marta.
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </section>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Grammatika — 8 mavzu                                               */
  /* ---------------------------------------------------------------- */
  if (typedSkill === 'grammar' && !query.topic) {
    const topics = await getGrammarTopics(user.uid)
    const withItems = topics.filter((topic) => topic.itemCount > 0)

    return (
      <div className="space-y-6">
        <PageHeader
          title="Grammatika mashqlari"
          description="8 ta grammatik mavzu — har biri iqtisodiy kontekstda: kompaniya natijalari, hisobotlar, qarorlar, muzokaralar."
          breadcrumbs={breadcrumbs}
        />

        {withItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={<Braces />}
                title="Grammatika mashqlari hali qo‘shilmagan"
                description="Mavzular bo‘yicha tasdiqlangan mashqlar paydo bo‘lgach, ular shu yerda ochiladi."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/student/learn?skill=grammar">Grammatika darslari</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{topic.en}</CardTitle>
                  <Badge variant="outline">{topic.cefr}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Iqtisodiy kontekst: {topic.context}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>O‘zlashtirish</span>
                    <span className="tabular-nums">{topic.mastery}%</span>
                  </div>
                  <Progress value={topic.mastery} aria-label={`${topic.en} o‘zlashtirish`} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{topic.itemCount} ta mashq</span>
                  <span>·</span>
                  <span>{topic.attempts} urinish</span>
                  <span>·</span>
                  <span>daraja {topic.difficulty}/5</span>
                </div>
                {topic.itemCount === 0 ? (
                  <Button type="button" variant="outline" className="w-full" disabled>
                    Mashqlar tayyorlanmoqda
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={`/student/practice/grammar?topic=${topic.id}`}>
                      Mashqni boshlash
                      <ArrowRight />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Umumiy adaptiv sessiya                                             */
  /* ---------------------------------------------------------------- */
  const count = Math.min(20, Math.max(5, Number(query.count) || 10))
  const session = await getPracticeSession(user.uid, {
    skill: typedSkill,
    topic: query.topic,
    count,
    adaptive: flags.adaptive,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${label.uz} mashqlari`}
        description={
          query.topic
            ? `Mavzu: ${query.topic}. Mashqlar sizning joriy darajangizga (${session.difficulty}/5 ≈ ${DIFFICULTY_CEFR[session.difficulty] ?? 'B1'}) moslashtirilgan.`
            : 'Adaptiv sessiya: har javobdan keyin qiyinlik va keyingi mashq qayta hisoblanadi.'
        }
        breadcrumbs={
          query.topic ? [...breadcrumbs, { label: query.topic }] : breadcrumbs
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Layers className="size-3" />
              {session.items.length} ta mashq
            </Badge>
            <Badge variant="secondary">O‘zlashtirish {session.masteryPercent}%</Badge>
          </div>
        }
      />

      <ExerciseRunner
        items={session.items}
        skill={typedSkill}
        topic={query.topic}
        difficulty={session.difficulty}
        aiExplain={flags.aiFeedback}
        adaptive={flags.adaptive}
        continueHref="/student/practice"
        continueLabel="Mashq maydoniga qaytish"
      />
    </div>
  )
}
