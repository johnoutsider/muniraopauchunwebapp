'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkillIcon } from '@/components/shared/skill-icon'
import { SKILL_LABELS, type Skill } from '@/config/constants'

import { QuestionRenderer, type QuestionResult } from './question-renderer'
import type { RunnerItem } from './types'

/**
 * Topshirilgan testni savol-savol ko'rib chiqish (read-only rejim).
 *
 * DIQQAT: to'g'ri javob va tushuntirish FAQAT diagnostika va progress
 * testlarda ochiladi. Pre/post testlarda kalit ko'rsatilmaydi — aks holda
 * talaba post-testga tayyorlanib olardi va eksperiment o'lchovi buzilardi
 * (PLAN 9, 17-bo'lim: test yaxlitligi).
 */

export interface ReviewItem {
  item: RunnerItem
  answer: string[]
  result: QuestionResult
}

export interface ReviewSection {
  id: string
  title: string
  skill: Skill
  items: ReviewItem[]
}

export interface AttemptReviewProps {
  sections: ReviewSection[]
  /** Kalit va tushuntirish ko'rsatilsinmi */
  revealAnswers: boolean
}

export function AttemptReview({ sections, revealAnswers }: AttemptReviewProps) {
  const withItems = sections.filter((section) => section.items.length > 0)
  if (!withItems.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Savollar tahlili</CardTitle>
        <p className="text-sm text-muted-foreground">
          {revealAnswers
            ? 'Har bir savol bo‘yicha javobingiz, to‘g‘ri variant va tushuntirish.'
            : 'Tadqiqot testi bo‘lgani uchun to‘g‘ri javoblar ko‘rsatilmaydi — faqat javobingiz to‘g‘ri yoki noto‘g‘ri ekani ko‘rinadi.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {withItems.map((section) => {
          const correct = section.items.filter((entry) => entry.result.isCorrect).length
          return (
            <details
              key={section.id}
              className="group rounded-lg border border-border [&[open]>summary]:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3 text-sm font-medium">
                <SkillIcon skill={section.skill} className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {section.title || SKILL_LABELS[section.skill].uz}
                </span>
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  {correct} / {section.items.length}
                </Badge>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <ol className="divide-y divide-border">
                {section.items.map((entry, index) => (
                  <li key={entry.item.id} className="space-y-3 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Savol {index + 1}
                    </p>
                    <QuestionRenderer
                      item={entry.item}
                      value={entry.answer}
                      onChange={noop}
                      readOnly
                      result={
                        revealAnswers
                          ? entry.result
                          : { isCorrect: entry.result.isCorrect, score: entry.result.score }
                      }
                    />
                  </li>
                ))}
              </ol>
            </details>
          )
        })}
      </CardContent>
    </Card>
  )
}

function noop() {
  /* read-only rejim — javob o'zgartirilmaydi */
}
