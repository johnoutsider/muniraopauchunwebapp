import * as React from 'react'
import { AudioLines, BookA, Braces, Dumbbell, Image as ImageIcon, PlayCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { FlagGate } from '@/components/shared/flag-gate'
import { EconChart } from '@/components/charts/econ-chart'
import { GRAMMAR_TOPICS } from '@/config/constants'
import { ExerciseRunner } from '@/features/practice/exercise-runner'
import type { RunnerItem } from '@/features/practice/types'
import { WordCard } from '@/features/vocabulary/word-card'
import type { FeatureFlags, LessonBlock, LexiconDoc } from '@/types'

import { AiExplainBlock } from './ai-explain-block'
import { SafeHtml } from './safe-html'
import { TtsButton } from './tts-button'

export interface LessonBlocksProps {
  blocks: LessonBlock[]
  lessonId: string
  lessonTitle: string
  words: Record<string, LexiconDoc & { id: string }>
  exercises: Record<string, RunnerItem[]>
  flags: FeatureFlags
}

/** Dars bloklarini ketma-ket render qilish (PLAN 5, 4-bosqich). */
export function LessonBlocks({
  blocks,
  lessonId,
  lessonTitle,
  words,
  exercises,
  flags,
}: LessonBlocksProps) {
  if (!blocks?.length) {
    return (
      <EmptyState
        title="Dars mazmuni bo‘sh"
        description="Bu darsga hali bloklar qo‘shilmagan. O‘qituvchingizga xabar bering."
      />
    )
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <section key={index} id={`block-${index}`} className="scroll-mt-24">
          <BlockRenderer
            block={block}
            index={index}
            lessonId={lessonId}
            lessonTitle={lessonTitle}
            words={words}
            exercises={exercises}
            flags={flags}
          />
        </section>
      ))}
    </div>
  )
}

interface BlockRendererProps extends Omit<LessonBlocksProps, 'blocks'> {
  block: LessonBlock
  index: number
}

function BlockRenderer({
  block,
  index,
  lessonId,
  lessonTitle,
  words,
  exercises,
  flags,
}: BlockRendererProps) {
  switch (block.kind) {
    /* -------------------------------------------------------------- */
    case 'text':
      return (
        <Card>
          <CardContent className="pt-6">
            <SafeHtml html={block.html} />
          </CardContent>
        </Card>
      )

    /* -------------------------------------------------------------- */
    case 'video':
      return <VideoBlock block={block} />

    /* -------------------------------------------------------------- */
    case 'infographic':
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-4 text-muted-foreground" />
              Infografika
            </CardTitle>
          </CardHeader>
          <CardContent>
            <figure className="space-y-2">
              {isSafeUrl(block.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={block.imageUrl}
                  alt={block.caption ?? 'Dars infografikasi'}
                  loading="lazy"
                  className="w-full rounded-lg border border-border"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Rasm manzili noto‘g‘ri.</p>
              )}
              {block.caption ? (
                <figcaption className="text-center text-xs text-muted-foreground">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          </CardContent>
        </Card>
      )

    /* -------------------------------------------------------------- */
    case 'chart':
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{block.caption ?? 'Iqtisodiy grafik'}</CardTitle>
          </CardHeader>
          <CardContent>
            <EconChart chartType={block.chartType} data={block.data} caption={block.caption} />
          </CardContent>
        </Card>
      )

    /* -------------------------------------------------------------- */
    case 'vocab': {
      const cards = block.wordIds.map((id) => words[id]).filter(Boolean)
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookA className="size-4 text-muted-foreground" />
              Yangi so‘zlar
              <Badge variant="secondary">{cards.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <EmptyState
                title="So‘zlar topilmadi"
                description="Bu blokdagi so‘zlar lug‘atda tasdiqlanmagan."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {cards.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    semanticNetwork={flags.semanticNetwork}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    /* -------------------------------------------------------------- */
    case 'grammar': {
      const topic = GRAMMAR_TOPICS.find((entry) => entry.id === block.topicId)
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <Braces className="size-4 text-muted-foreground" />
              {topic?.en ?? 'Grammatika'}
              {topic ? <Badge variant="outline">{topic.cefr}</Badge> : null}
            </CardTitle>
            {topic ? (
              <p className="text-xs text-muted-foreground">
                Iqtisodiy kontekst: {topic.context}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <SafeHtml html={block.explanationHtml} />
            {block.examples?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Misollar
                </p>
                <ul className="space-y-1.5">
                  {block.examples.map((example, exampleIndex) => (
                    <li
                      key={exampleIndex}
                      className="rounded-lg border border-border p-3 text-sm leading-relaxed"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )
    }

    /* -------------------------------------------------------------- */
    case 'pronunciation':
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AudioLines className="size-4 text-muted-foreground" />
              Talaffuz
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Namunani tinglang va ovoz chiqarib takrorlang.
            </p>
          </CardHeader>
          <CardContent>
            {block.words.length === 0 ? (
              <EmptyState title="So‘zlar yo‘q" description="Talaffuz ro‘yxati bo‘sh." />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {block.words.map((entry) => (
                  <li
                    key={entry.word}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{entry.word}</span>
                      {entry.ipa ? (
                        <span className="block font-mono text-xs text-muted-foreground">
                          /{entry.ipa}/
                        </span>
                      ) : null}
                    </span>
                    <TtsButton text={entry.word} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )

    /* -------------------------------------------------------------- */
    case 'exercises': {
      const items = exercises[String(index)] ?? []
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-4 text-muted-foreground" />
              {block.title ?? 'Mashqlar'}
              <Badge variant="secondary">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <EmptyState
                title="Mashqlar topilmadi"
                description="Bu blokdagi mashqlar hali tasdiqlanmagan."
              />
            ) : (
              <ExerciseRunner
                items={items}
                context="lesson"
                contextId={lessonId}
                skill={items[0]?.skill}
                topic={items[0]?.topic}
                aiExplain={flags.aiFeedback}
                adaptive={flags.adaptive}
                compact
                continueHref={`/student/learn/${lessonId}`}
                continueLabel="Darsga qaytish"
              />
            )}
          </CardContent>
        </Card>
      )
    }

    /* -------------------------------------------------------------- */
    case 'ai_explain':
      return (
        <FlagGate enabled={flags.aiTutor}>
          <AiExplainBlock
            prompt={block.prompt}
            label={block.label}
            lessonId={lessonId}
            lessonTitle={lessonTitle}
          />
        </FlagGate>
      )

    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Video                                                               */
/* ------------------------------------------------------------------ */

function VideoBlock({ block }: { block: Extract<LessonBlock, { kind: 'video' }> }) {
  const embed = embedUrl(block.provider, block.src)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="size-4 text-muted-foreground" />
          {block.caption ?? 'Video dars'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!embed ? (
          <p className="text-sm text-muted-foreground">Video manzili noto‘g‘ri.</p>
        ) : block.provider === 'storage' ? (
          <video
            controls
            preload="metadata"
            src={embed}
            className="aspect-video w-full rounded-lg border border-border bg-black"
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
            <iframe
              src={embed}
              title={block.caption ?? 'Video dars'}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full"
            />
          </div>
        )}
        {block.caption ? (
          <p className="mt-2 text-xs text-muted-foreground">{block.caption}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function embedUrl(provider: 'youtube' | 'vimeo' | 'storage', src: string): string | null {
  if (!src) return null

  if (provider === 'youtube') {
    const id = src.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1]
      ?? (/^[A-Za-z0-9_-]{11}$/.test(src) ? src : null)
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }

  if (provider === 'vimeo') {
    const id = src.match(/(\d{6,})/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }

  return isSafeUrl(src) ? src : null
}

function isSafeUrl(url: string): boolean {
  return typeof url === 'string' && /^https:\/\//i.test(url)
}
