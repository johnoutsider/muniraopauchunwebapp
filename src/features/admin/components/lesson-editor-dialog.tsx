'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CEFR_LEVELS, GRAMMAR_TOPICS, type CefrLevel } from '@/config/constants'
import type { LessonBlock, LessonDoc } from '@/types'

import { saveLessonAction } from '../actions'

const BLOCK_LABELS: Record<LessonBlock['kind'], string> = {
  text: 'Matn (HTML)',
  video: 'Video',
  infographic: 'Infografika',
  chart: 'Grafik',
  vocab: 'Lug‘at bloki',
  grammar: 'Grammatika',
  pronunciation: 'Talaffuz',
  exercises: 'Mashqlar',
  ai_explain: 'AI tushuntirish',
}

const BLOCK_KINDS = Object.keys(BLOCK_LABELS) as Array<LessonBlock['kind']>

function emptyBlock(kind: LessonBlock['kind']): LessonBlock {
  switch (kind) {
    case 'text':
      return { kind: 'text', html: '' }
    case 'video':
      return { kind: 'video', provider: 'youtube', src: '', caption: '' }
    case 'infographic':
      return { kind: 'infographic', imageUrl: '', caption: '' }
    case 'chart':
      return { kind: 'chart', chartType: 'line', data: [], caption: '' }
    case 'vocab':
      return { kind: 'vocab', wordIds: [] }
    case 'grammar':
      return { kind: 'grammar', topicId: GRAMMAR_TOPICS[0].id, explanationHtml: '', examples: [] }
    case 'pronunciation':
      return { kind: 'pronunciation', words: [] }
    case 'exercises':
      return { kind: 'exercises', itemIds: [], title: '' }
    case 'ai_explain':
      return { kind: 'ai_explain', prompt: '', label: '' }
  }
}

function linesToArray(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export interface LessonEditorDialogProps {
  trigger: React.ReactNode
  courseId: string
  moduleId: string
  lesson?: LessonDoc & { id: string }
  nextOrder: number
}

export function LessonEditorDialog({
  trigger,
  courseId,
  moduleId,
  lesson,
  nextOrder,
}: LessonEditorDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const [title, setTitle] = React.useState(lesson?.title ?? '')
  const [summary, setSummary] = React.useState(lesson?.summary ?? '')
  const [type, setType] = React.useState<LessonDoc['type']>(lesson?.type ?? 'interactive')
  const [cefr, setCefr] = React.useState<CefrLevel>(lesson?.cefr ?? 'B1')
  const [estimatedMin, setEstimatedMin] = React.useState(lesson?.estimatedMin ?? 20)
  const [order, setOrder] = React.useState(lesson?.order ?? nextOrder)
  const [published, setPublished] = React.useState(lesson?.published ?? false)
  const [blocks, setBlocks] = React.useState<LessonBlock[]>(lesson?.blocks ?? [])
  const [newKind, setNewKind] = React.useState<LessonBlock['kind']>('text')

  function updateBlock(index: number, patch: Partial<LessonBlock>) {
    setBlocks((prev) =>
      prev.map((block, i) => (i === index ? ({ ...block, ...patch } as LessonBlock) : block))
    )
  }

  function move(index: number, delta: number) {
    setBlocks((prev) => {
      const next = [...prev]
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveLessonAction({
        id: lesson?.id,
        courseId,
        moduleId,
        title,
        summary,
        type,
        cefr,
        estimatedMin,
        order,
        published,
        blocks,
      })
      if (result.ok) {
        toast.success(lesson ? 'Dars yangilandi' : 'Dars yaratildi')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Darsni tahrirlash' : 'Yangi dars'}</DialogTitle>
          <DialogDescription>
            Dars bloklardan tuziladi. Bloklar tartibini strelkalar bilan o‘zgartiring — talaba
            ularni shu ketma-ketlikda ko‘radi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="lesson-title">Sarlavha</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lesson-summary">Qisqacha</Label>
            <Textarea
              id="lesson-summary"
              rows={2}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Turi</Label>
              <Select value={type} onValueChange={(value) => setType(value as LessonDoc['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="interactive">Interaktiv</SelectItem>
                  <SelectItem value="explanation">Tushuntirish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CEFR</Label>
              <Select value={cefr} onValueChange={(value) => setCefr(value as CefrLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-min">Davomiyligi (daq)</Label>
              <Input
                id="lesson-min"
                type="number"
                min={1}
                value={estimatedMin}
                onChange={(event) => setEstimatedMin(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lesson-order">Tartib</Label>
              <Input
                id="lesson-order"
                type="number"
                min={0}
                value={order}
                onChange={(event) => setOrder(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="lesson-published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="lesson-published">Nashr etilgan (talabalarga ko‘rinadi)</Label>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Dars bloklari ({blocks.length})</Label>
              <div className="flex gap-2">
                <Select
                  value={newKind}
                  onValueChange={(value) => setNewKind(value as LessonBlock['kind'])}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {BLOCK_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBlocks((prev) => [...prev, emptyBlock(newKind)])}
                >
                  <Plus />
                  Qo‘shish
                </Button>
              </div>
            </div>

            {blocks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Blok qo‘shilmagan. Yuqoridagi ro‘yxatdan blok turini tanlab «Qo‘shish» tugmasini
                bosing.
              </p>
            ) : null}

            {blocks.map((block, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">
                    {index + 1}. {BLOCK_LABELS[block.kind]}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === blocks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {block.kind === 'text' ? (
                  <Textarea
                    rows={4}
                    value={block.html}
                    onChange={(event) => updateBlock(index, { html: event.target.value })}
                    placeholder="<p>Matn…</p>"
                  />
                ) : null}

                {block.kind === 'video' ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      value={block.provider}
                      onValueChange={(value) =>
                        updateBlock(index, { provider: value as 'youtube' | 'vimeo' | 'storage' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="vimeo">Vimeo</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={block.src}
                      onChange={(event) => updateBlock(index, { src: event.target.value })}
                      placeholder="Video ID yoki URL"
                    />
                    <Input
                      value={block.caption ?? ''}
                      onChange={(event) => updateBlock(index, { caption: event.target.value })}
                      placeholder="Izoh"
                    />
                  </div>
                ) : null}

                {block.kind === 'infographic' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={block.imageUrl}
                      onChange={(event) => updateBlock(index, { imageUrl: event.target.value })}
                      placeholder="Rasm URL"
                    />
                    <Input
                      value={block.caption ?? ''}
                      onChange={(event) => updateBlock(index, { caption: event.target.value })}
                      placeholder="Izoh"
                    />
                  </div>
                ) : null}

                {block.kind === 'chart' ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        value={block.chartType}
                        onValueChange={(value) =>
                          updateBlock(index, { chartType: value as 'line' | 'bar' | 'pie' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Chiziqli</SelectItem>
                          <SelectItem value="bar">Ustunli</SelectItem>
                          <SelectItem value="pie">Doiraviy</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={block.caption ?? ''}
                        onChange={(event) => updateBlock(index, { caption: event.target.value })}
                        placeholder="Izoh"
                      />
                    </div>
                    <Textarea
                      rows={4}
                      className="font-mono text-xs"
                      defaultValue={JSON.stringify(block.data, null, 2)}
                      onBlur={(event) => {
                        try {
                          const parsed = JSON.parse(event.target.value || '[]')
                          if (Array.isArray(parsed)) updateBlock(index, { data: parsed })
                          else toast.error('Grafik ma’lumoti massiv bo‘lishi kerak')
                        } catch {
                          toast.error('JSON noto‘g‘ri — grafik ma’lumoti saqlanmadi')
                        }
                      }}
                      placeholder='[{"year": 2020, "gdp": 5.2}]'
                    />
                  </div>
                ) : null}

                {block.kind === 'vocab' ? (
                  <Textarea
                    rows={2}
                    value={block.wordIds.join('\n')}
                    onChange={(event) =>
                      updateBlock(index, { wordIds: linesToArray(event.target.value) })
                    }
                    placeholder="Lug‘at hujjat ID’lari (har qatorda bittadan)"
                  />
                ) : null}

                {block.kind === 'grammar' ? (
                  <div className="space-y-3">
                    <Select
                      value={block.topicId}
                      onValueChange={(value) => updateBlock(index, { topicId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRAMMAR_TOPICS.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.en} — {topic.context}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      rows={3}
                      value={block.explanationHtml}
                      onChange={(event) =>
                        updateBlock(index, { explanationHtml: event.target.value })
                      }
                      placeholder="Tushuntirish (HTML)"
                    />
                    <Textarea
                      rows={3}
                      value={block.examples.join('\n')}
                      onChange={(event) =>
                        updateBlock(index, { examples: linesToArray(event.target.value) })
                      }
                      placeholder="Misollar (har qatorda bittadan)"
                    />
                  </div>
                ) : null}

                {block.kind === 'pronunciation' ? (
                  <Textarea
                    rows={3}
                    value={block.words
                      .map((word) => (word.ipa ? `${word.word} | ${word.ipa}` : word.word))
                      .join('\n')}
                    onChange={(event) =>
                      updateBlock(index, {
                        words: event.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [word, ipa] = line.split('|').map((part) => part.trim())
                            return ipa ? { word, ipa } : { word }
                          }),
                      })
                    }
                    placeholder="inflation | ɪnˈfleɪʃn"
                  />
                ) : null}

                {block.kind === 'exercises' ? (
                  <div className="space-y-3">
                    <Input
                      value={block.title ?? ''}
                      onChange={(event) => updateBlock(index, { title: event.target.value })}
                      placeholder="Blok sarlavhasi"
                    />
                    <Textarea
                      rows={3}
                      value={block.itemIds.join('\n')}
                      onChange={(event) =>
                        updateBlock(index, { itemIds: linesToArray(event.target.value) })
                      }
                      placeholder="Mashq ID’lari (har qatorda bittadan)"
                    />
                  </div>
                ) : null}

                {block.kind === 'ai_explain' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={block.label}
                      onChange={(event) => updateBlock(index, { label: event.target.value })}
                      placeholder="Tugma matni (masalan: «AI’dan so‘rash»)"
                    />
                    <Input
                      value={block.prompt}
                      onChange={(event) => updateBlock(index, { prompt: event.target.value })}
                      placeholder="AI uchun prompt"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" loading={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
